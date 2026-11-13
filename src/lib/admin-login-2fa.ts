import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml, generateSixDigitCode, hashShortCode } from "@/lib/security";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export async function createAdminLoginChallenge(user: { id: string; email: string; name: string }) {
  const code = generateSixDigitCode();
  const codeHash = hashShortCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await prisma.adminLoginChallenge.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const challenge = await prisma.adminLoginChallenge.create({
    data: {
      userId: user.id,
      email: user.email,
      codeHash,
      expiresAt,
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`\n[DEV] Código 2FA para ${user.email}: ${code}\n`);
  }

  await sendEmail({
    to: [user.email],
    subject: "Codigo de verificacao para login admin",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">Verificacao de login admin</h2>
        <p>Ola ${escapeHtml(user.name)},</p>
        <p>Recebemos um pedido de login na area de administracao. Use este codigo para concluir a autenticacao:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0">${code}</p>
        <p>Este codigo expira em ${CODE_TTL_MINUTES} minutos.</p>
        <p>Se nao foste tu, ignora este email e altera a tua password.</p>
      </div>
    `,
    text: `Verificacao de login admin\n\nCodigo: ${code}\n\nValido por ${CODE_TTL_MINUTES} minutos.`,
  });

  return challenge.id;
}

type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

export async function verifyAdminLoginChallenge(
  challengeId: string,
  code: string
): Promise<VerifyResult> {
  const challenge = await prisma.adminLoginChallenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      userId: true,
      codeHash: true,
      used: true,
      expiresAt: true,
      attempts: true,
    },
  });

  if (!challenge || challenge.used) {
    return { ok: false, reason: "invalid" };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.adminLoginChallenge.update({
      where: { id: challenge.id },
      data: { used: true },
    });
    return { ok: false, reason: "expired" };
  }

  // Incremento atómico: pedidos em paralelo não ultrapassam MAX_ATTEMPTS.
  const claimed = await prisma.adminLoginChallenge.updateMany({
    where: { id: challenge.id, used: false, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (claimed.count === 0) {
    await prisma.adminLoginChallenge.update({
      where: { id: challenge.id },
      data: { used: true },
    });
    return { ok: false, reason: "too_many_attempts" };
  }

  if (hashShortCode(code) !== challenge.codeHash) {
    return { ok: false, reason: "invalid" };
  }

  // Só um pedido consegue consumir o código.
  const consumed = await prisma.adminLoginChallenge.updateMany({
    where: { id: challenge.id, used: false },
    data: { used: true },
  });
  if (consumed.count === 0) return { ok: false, reason: "invalid" };

  return { ok: true, userId: challenge.userId };
}
