import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { consumeRateLimit, getClientIp, normalizeEmail } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = consumeRateLimit({
      key: `auth:reset:ip:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { email, code, newPassword } = body ?? {};

    const normalizedEmail = normalizeEmail(email);
    if (
      !normalizedEmail ||
      typeof code !== "string" ||
      !code.trim() ||
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return NextResponse.json(
        { error: "Email, código e nova password são obrigatórios." },
        { status: 400 }
      );
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "A nova password não cumpre os requisitos mínimos." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim();

    const reset = await prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        code: normalizedCode,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!reset) {
      return NextResponse.json(
        { error: "Código inválido ou expirado. Solicite um novo código." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password alterada com sucesso. Já pode iniciar sessão.",
    });
  } catch (err) {
    console.error("Erro reset-password:", err);
    return NextResponse.json(
      { error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
