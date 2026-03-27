import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp, normalizeEmail } from "@/lib/security";

const CODE_EXPIRY_MINUTES = 15;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Serviço de email não configurado." },
      { status: 500 }
    );
  }

  try {
    const ip = getClientIp(request);
    const ipLimit = consumeRateLimit({
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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não existe nenhuma conta associada a este email. Verifique o endereço ou crie uma conta.",
        },
        { status: 404 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        code,
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

    return NextResponse.json({
      success: true,
      message: "Código enviado. Verifique o seu email.",
    });
  } catch (err) {
    console.error("Erro forgot-password:", err);
    return NextResponse.json(
      { error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
