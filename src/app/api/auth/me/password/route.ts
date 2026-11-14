import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, getSessionFromRequest, signSessionJwt } from "@/lib/auth";
import { getSessionCookieOptions } from "@/lib/session-cookie";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { consumeRateLimitDb } from "@/lib/security";

/**
 * Mudar a password com sessão iniciada. Termina as sessões nos outros dispositivos
 * (incrementa sessionVersion) e renova o cookie deste.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const limit = await consumeRateLimitDb({
    key: `auth:change-password:${session.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "Demasiadas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true, passwordHash: true, sessionVersion: true },
  });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return Response.json({ error: "A password atual está incorreta." }, { status: 401 });
  }
  if (newPassword.length > 256 || !validatePassword(newPassword).isValid) {
    return Response.json(
      { error: "A nova password tem de ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo." },
      { status: 400 }
    );
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    return Response.json({ error: "A nova password tem de ser diferente da atual." }, { status: 400 });
  }

  const sessionVersion = (user.sessionVersion ?? 0) + 1;
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), sessionVersion },
  });

  const token = await signSessionJwt({
    id: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    sessionVersion,
  });
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(60 * 60 * 24 * 7));
  return res;
}
