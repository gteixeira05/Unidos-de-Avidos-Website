import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { consumeRateLimitDb, getClientIp, hashShortCode, normalizeEmail } from "@/lib/security";

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await consumeRateLimitDb({
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

    const invalid = NextResponse.json(
      { error: "Código inválido ou expirado. Solicite um novo código." },
      { status: 400 }
    );

    // Só o pedido mais recente conta (o forgot-password invalida os anteriores).
    const reset = await prisma.passwordReset.findFirst({
      where: { email: normalizedEmail, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!reset) return invalid;

    // Incremento atómico: pedidos em paralelo não ultrapassam MAX_ATTEMPTS.
    const claimed = await prisma.passwordReset.updateMany({
      where: { id: reset.id, used: false, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (claimed.count === 0) {
      await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
      return invalid;
    }

    if (hashShortCode(code.trim()) !== reset.code) return invalid;

    // Marca como usado só se ainda não foi (evita usar o mesmo código duas vezes em paralelo).
    const consumed = await prisma.passwordReset.updateMany({
      where: { id: reset.id, used: false },
      data: { used: true },
    });
    if (consumed.count === 0) return invalid;

    const passwordHash = await hashPassword(newPassword);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { sessionVersion: true },
    });
    if (!user) return invalid;

    // Nova password termina todas as sessões abertas.
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash, sessionVersion: (user.sessionVersion ?? 0) + 1 },
    });

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
