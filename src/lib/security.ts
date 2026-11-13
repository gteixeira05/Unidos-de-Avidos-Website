import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export {
  consumeRateLimit,
  escapeHtml,
  getClientIp,
  normalizeEmail,
  shouldAllowMutationFromOrigin,
} from "@/utils/security";

/**
 * Rate limit guardado no MongoDB: partilhado entre instâncias serverless e sobrevive a cold starts.
 * Usar nas rotas sensíveis (login, reset, registo, contacto). O middleware (edge) mantém o limite em memória.
 */
export async function consumeRateLimitDb(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = new Date();
  const bumped = await prisma.rateLimit.updateMany({
    where: { key: opts.key, resetAt: { gt: now } },
    data: { count: { increment: 1 } },
  });

  if (bumped.count === 0) {
    // Janela nova (ou expirada).
    const resetAt = new Date(now.getTime() + opts.windowMs);
    try {
      await prisma.rateLimit.upsert({
        where: { key: opts.key },
        create: { key: opts.key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    } catch {
      // ponytail: corrida na criação da mesma chave; o pedido seguinte já conta
    }
    return { ok: true, retryAfterSec: Math.ceil(opts.windowMs / 1000) };
  }

  const entry = await prisma.rateLimit.findUnique({ where: { key: opts.key } });
  const retryAfterSec = Math.max(
    1,
    Math.ceil(((entry?.resetAt.getTime() ?? now.getTime()) - now.getTime()) / 1000)
  );
  return { ok: (entry?.count ?? 0) <= opts.limit, retryAfterSec };
}

export function generateSixDigitCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** Hash de códigos curtos (OTP / reset) com o segredo da app; nunca guardar o código em claro. */
export function hashShortCode(code: string): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET (ou NEXTAUTH_SECRET) não está definido.");
  return crypto.createHash("sha256").update(`${secret}::${code}`).digest("hex");
}
