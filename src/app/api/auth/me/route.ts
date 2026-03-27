import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";

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

