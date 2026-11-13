import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  consumeRateLimitDb,
  generateSixDigitCode,
  getClientIp,
  hashShortCode,
  normalizeEmail,
} from "@/lib/security";

const CODE_EXPIRY_MINUTES = 15;

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Serviço de email não configurado." },
      { status: 500 }
    );
  }

  try {
    const ip = getClientIp(request);
    const ipLimit = await consumeRateLimitDb({
      key: `auth:forgot:ip:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Demasiados pedidos de recuperação. Tente mais tarde." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { email } = body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    // Resposta igual exista ou não a conta (evita descobrir emails registados).
    const okResponse = NextResponse.json({
      success: true,
      message: "Se existir uma conta com este email, enviámos um código. Verifique o seu email.",
    });

    const emailLimit = await consumeRateLimitDb({
      key: `auth:forgot:email:${normalizedEmail}`,
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!emailLimit.ok) return okResponse;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (!user) return okResponse;

    // Só o código mais recente é válido.
    await prisma.passwordReset.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    const code = generateSixDigitCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        code: hashShortCode(code),
        attempts: 0,
        expiresAt,
      },
    });

    await sendEmail({
      to: [normalizedEmail],
      subject: "Código de recuperação de password - Unidos de Avidos",
      html: `
        <p>Olá,</p>
        <p>Recebeu este email porque solicitou a recuperação da password da sua conta.</p>
        <p><strong>O seu código de verificação é: ${code}</strong></p>
        <p>Este código expira em ${CODE_EXPIRY_MINUTES} minutos. Se não solicitou esta recuperação, ignore este email.</p>
        <p>Unidos de Avidos</p>
      `,
    });

    return okResponse;
  } catch (err) {
    console.error("Erro forgot-password:", err);
    return NextResponse.json(
      { error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
