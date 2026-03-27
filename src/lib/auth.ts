import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import type { SessionRole, SessionUser } from "@/types/auth";

export type { SessionUser } from "@/types/auth";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET (ou NEXTAUTH_SECRET) não está definido.");
  }
  return new TextEncoder().encode(secret);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function signSessionJwt(user: Pick<SessionUser, "id" | "role">) {
  const secretKey = getSecretKey();
  return await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/** Verifica o JWT e devolve o id do utilizador (sub). O campo role no token não é fonte de verdade. */
export async function getUserIdFromSessionToken(token: string): Promise<string | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    const sub = payload.sub;
    if (typeof sub !== "string") return null;
    return sub;
  } catch {
    return null;
  }
}

async function getSessionFromToken(token: string): Promise<SessionUser | null> {
  const userId = await getUserIdFromSessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "USER") return null;

  const isSuperAdmin = isSuperAdminEmail(user.email);
  return {
    id: user.id,
    role: isSuperAdmin ? "ADMIN" : (user.role as SessionRole),
    isSuperAdmin,
    email: user.email,
    name: user.name,
  };
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionFromToken(token);
}

export async function getSessionFromCookieValue(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  return getSessionFromToken(token);
}

/** Destino seguro após login (?next=); evita open redirect. */
export function safeRedirectPath(next: string | undefined | null): string {
  if (!next || typeof next !== "string") return "/perfil";
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/perfil";
  return t.split("?")[0] || "/perfil";
}
