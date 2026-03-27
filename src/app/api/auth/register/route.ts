import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { consumeRateLimit, getClientIp, normalizeEmail } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = consumeRateLimit({
      key: `auth:register:ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return Response.json(
        { error: "Demasiados registos. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { name, email, password, phone, emailComunicacoesConsent } = body ?? {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
      return Response.json(
        { error: "Nome inválido." },
        { status: 400 }
      );
    }
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== "string" || password.length < 8 || password.length > 256) {
      return Response.json(
        { error: "Nome, email e password são obrigatórios." },
        { status: 400 }
      );
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      return Response.json(
        { error: "A password não cumpre os requisitos mínimos.", details: validation },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return Response.json(
        { error: "Já existe um utilizador registado com este email." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: typeof phone === "string" ? phone.trim().slice(0, 40) || null : null,
        emailComunicacoesConsent: emailComunicacoesConsent === true,
        emailComunicacoesConsentAt: emailComunicacoesConsent === true ? new Date() : null,
        emailComunicacoesConsentVersion:
          emailComunicacoesConsent === true ? "2026-03-marketing-v1" : null,
        emailComunicacoesRevokedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailComunicacoesConsent: true,
      },
    });

    return Response.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Erro no registo:", error);
    return Response.json(
      { error: "Ocorreu um erro ao registar o utilizador." },
      { status: 500 }
    );
  }
}

