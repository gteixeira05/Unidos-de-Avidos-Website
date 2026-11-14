import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, getSessionFromRequest } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { getSessionCookieOptions } from "@/lib/session-cookie";
import { verifyPassword } from "@/lib/password";
import { consumeRateLimitDb } from "@/lib/security";

function isUnknownConsentFieldError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Unknown field `emailComunicacoesConsent`")
  );
}

const ME_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, must-revalidate",
  Vary: "Cookie",
} as const;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ user: null }, { status: 200, headers: ME_RESPONSE_HEADERS });
  }

  let user:
    | {
        id: string;
        name: string;
        email: string;
        role: string;
        emailNotifContacto: boolean;
        emailNotifReservas: boolean;
        emailComunicacoesConsent: boolean;
        emailComunicacoesConsentAt: Date | null;
        emailComunicacoesConsentVersion: string | null;
        emailComunicacoesRevokedAt: Date | null;
      }
    | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailNotifContacto: true,
        emailNotifReservas: true,
        emailComunicacoesConsent: true,
        emailComunicacoesConsentAt: true,
        emailComunicacoesConsentVersion: true,
        emailComunicacoesRevokedAt: true,
      },
    });
  } catch (error) {
    if (!isUnknownConsentFieldError(error)) throw error;
    // Fallback para cliente Prisma em runtime sem os novos campos de consentimento.
    const legacyUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailNotifContacto: true,
        emailNotifReservas: true,
      },
    });
    if (legacyUser) {
      user = {
        ...legacyUser,
        emailComunicacoesConsent: false,
        emailComunicacoesConsentAt: null,
        emailComunicacoesConsentVersion: null,
        emailComunicacoesRevokedAt: null,
      };
    }
  }

  if (!user) {
    return Response.json({ user: null }, { status: 200, headers: ME_RESPONSE_HEADERS });
  }

  const role = isSuperAdminEmail(user.email) ? "SUPER_ADMIN" : user.role;
  return Response.json(
    { user: { ...user, role } },
    { status: 200, headers: ME_RESPONSE_HEADERS }
  );
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const emailNotifContacto = body?.emailNotifContacto;
  const emailNotifReservas = body?.emailNotifReservas;
  const emailComunicacoesConsent = body?.emailComunicacoesConsent;

  const isAdminPrefsPayload =
    typeof emailNotifContacto === "boolean" && typeof emailNotifReservas === "boolean";
  const isMarketingPayload = typeof emailComunicacoesConsent === "boolean";

  if (!isAdminPrefsPayload && !isMarketingPayload) {
    return Response.json({ error: "Preferências inválidas." }, { status: 400 });
  }

  if (isAdminPrefsPayload && session.role !== "ADMIN" && !session.isSuperAdmin) {
    return Response.json({ error: "Sem permissões." }, { status: 403 });
  }

  const updateData: {
    emailNotifContacto?: boolean;
    emailNotifReservas?: boolean;
    emailComunicacoesConsent?: boolean;
    emailComunicacoesConsentAt?: Date | null;
    emailComunicacoesConsentVersion?: string | null;
    emailComunicacoesRevokedAt?: Date | null;
  } = {};

  if (isAdminPrefsPayload) {
    updateData.emailNotifContacto = emailNotifContacto;
    updateData.emailNotifReservas = emailNotifReservas;
  }
  if (isMarketingPayload) {
    updateData.emailComunicacoesConsent = emailComunicacoesConsent;
    if (emailComunicacoesConsent) {
      updateData.emailComunicacoesConsentAt = new Date();
      updateData.emailComunicacoesConsentVersion = "2026-03-marketing-v1";
      updateData.emailComunicacoesRevokedAt = null;
    } else {
      updateData.emailComunicacoesRevokedAt = new Date();
    }
  }

  let user:
    | {
        id: string;
        name: string;
        email: string;
        role: string;
        emailNotifContacto: boolean;
        emailNotifReservas: boolean;
        emailComunicacoesConsent: boolean;
        emailComunicacoesConsentAt: Date | null;
        emailComunicacoesConsentVersion: string | null;
        emailComunicacoesRevokedAt: Date | null;
      }
    | null = null;

  try {
    user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailNotifContacto: true,
        emailNotifReservas: true,
        emailComunicacoesConsent: true,
        emailComunicacoesConsentAt: true,
        emailComunicacoesConsentVersion: true,
        emailComunicacoesRevokedAt: true,
      },
    });
  } catch (error) {
    if (!isUnknownConsentFieldError(error)) throw error;
    if (isMarketingPayload && !isAdminPrefsPayload) {
      return Response.json(
        { error: "Atualização de consentimento indisponível temporariamente. Reinicie o servidor." },
        { status: 503 }
      );
    }
    const legacyUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(isAdminPrefsPayload
          ? { emailNotifContacto, emailNotifReservas }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailNotifContacto: true,
        emailNotifReservas: true,
      },
    });
    user = {
      ...legacyUser,
      emailComunicacoesConsent: false,
      emailComunicacoesConsentAt: null,
      emailComunicacoesConsentVersion: null,
      emailComunicacoesRevokedAt: null,
    };
  }

  return Response.json({ success: true, user }, { status: 200 });
}


/**
 * RGPD — o utilizador elimina a própria conta (pede a password).
 * As reservas ficam para histórico/contabilidade, mas anonimizadas; avaliações e notificações são apagadas.
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  if (session.role === "ADMIN" || session.isSuperAdmin) {
    return Response.json(
      { error: "Contas de administração não podem ser eliminadas aqui. Peça a outro administrador para retirar as permissões primeiro." },
      { status: 403 }
    );
  }

  const limit = await consumeRateLimitDb({
    key: `auth:delete-account:${session.id}`,
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
  const password = typeof body?.password === "string" ? body.password : "";
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user || !password || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Password incorreta." }, { status: 401 });
  }

  const pendente = await prisma.reserva.findFirst({
    where: {
      userId: user.id,
      OR: [
        { estado: "PENDENTE" },
        { estado: "APROVADA", arquivada: false },
        { caucaoPaga: true, caucaoDevolvida: false },
      ],
    },
    select: { id: true },
  });
  if (pendente) {
    return Response.json(
      {
        error:
          "Tem reservas em curso ou uma caução por devolver. Cancele as reservas pendentes ou aguarde a conclusão antes de eliminar a conta.",
      },
      { status: 409 }
    );
  }

  await prisma.reserva.updateMany({
    where: { userId: user.id },
    data: { userId: null, nome: "Conta eliminada", email: null, telefone: null, observacoes: null },
  });
  await prisma.avaliacao.deleteMany({ where: { userId: user.id } });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.passwordReset.deleteMany({ where: { email: user.email } });
  await prisma.adminLoginChallenge.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", getSessionCookieOptions(0));
  return res;
}
