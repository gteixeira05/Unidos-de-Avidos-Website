import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getSessionCookieName, signSessionJwt } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { getSessionCookieOptions } from "@/lib/session-cookie";
import { consumeRateLimit, getClientIp, normalizeEmail } from "@/lib/security";
import {
  createAdminLoginChallenge,
  verifyAdminLoginChallenge,
} from "@/lib/admin-login-2fa";

function buildSessionResponse(user: { id: string; name: string; email: string; role: string }) {
  return signSessionJwt({
    id: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  }).then((token) => {
    const res = NextResponse.json({ success: true, user });
    res.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(60 * 60 * 24 * 7));
    return res;
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = consumeRateLimit({
      key: `auth:login:ip:${ip}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return Response.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      twoFactorChallengeId,
      twoFactorCode,
    } = body ?? {};

    const isTwoFactorAttempt = Boolean(twoFactorChallengeId || twoFactorCode);

    if (isTwoFactorAttempt) {
      if (
        typeof twoFactorChallengeId !== "string" ||
        typeof twoFactorCode !== "string" ||
        !twoFactorChallengeId ||
        !twoFactorCode
      ) {
        return Response.json(
          { error: "Código de verificação inválido." },
          { status: 400 }
        );
      }

      const cleanCode = twoFactorCode.replace(/\D/g, "").slice(0, 6);
      if (cleanCode.length !== 6) {
        return Response.json(
          { error: "Introduza um código de 6 dígitos." },
          { status: 400 }
        );
      }

      const verifyResult = await verifyAdminLoginChallenge(
        twoFactorChallengeId,
        cleanCode
      );
      if (!verifyResult.ok) {
        if (verifyResult.reason === "expired") {
          return Response.json(
            { error: "Código expirado. Inicie login novamente." },
            { status: 401 }
          );
        }
        if (verifyResult.reason === "too_many_attempts") {
          return Response.json(
            { error: "Muitas tentativas. Inicie login novamente." },
            { status: 429 }
          );
        }
        return Response.json(
          { error: "Código inválido." },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: verifyResult.userId },
      });
      if (!user) {
        return Response.json(
          { error: "Utilizador não encontrado." },
          { status: 401 }
        );
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: isSuperAdminEmail(user.email) ? "SUPER_ADMIN" : user.role,
      };
      return buildSessionResponse(safeUser);
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== "string" || password.length < 1 || password.length > 256) {
      return Response.json(
        { error: "Email e password são obrigatórios." },
        { status: 400 }
      );
    }

    const emailLimit = consumeRateLimit({
      key: `auth:login:email:${normalizedEmail}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailLimit.ok) {
      return Response.json(
        { error: "Conta temporariamente bloqueada por excesso de tentativas." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return Response.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return Response.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isSuperAdminEmail(user.email) ? "SUPER_ADMIN" : user.role,
    };

    const requiresTwoFactor =
      safeUser.role === "ADMIN" || safeUser.role === "SUPER_ADMIN";
    if (requiresTwoFactor) {
      const challengeId = await createAdminLoginChallenge(safeUser);
      return Response.json(
        {
          success: false,
          requiresTwoFactor: true,
          twoFactorChallengeId: challengeId,
          email: safeUser.email,
        },
        { status: 200 }
      );
    }

    return buildSessionResponse(safeUser);
  } catch (error) {
    console.error("Erro no login:", error);
    return Response.json(
      { error: "Ocorreu um erro ao efetuar login." },
      { status: 500 }
    );
  }
}

