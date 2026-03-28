import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL } from "@/lib/super-admin";

export type AdminTeamMember = {
  id: string;
  email: string;
  name: string | null;
  emailNotifReservas: boolean;
  emailNotifContacto: boolean;
};

/** Conta de Super Admin na BD (email fixo no código), independentemente do role. */
export async function findSuperAdminUserRow(): Promise<AdminTeamMember | null> {
  const raw = SUPER_ADMIN_EMAIL.trim();
  const norm = raw.toLowerCase();
  const u = await prisma.user.findFirst({
    where: {
      OR: [{ email: raw }, { email: norm }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailNotifReservas: true,
      emailNotifContacto: true,
    },
  });
  if (!u || !isSuperAdminEmail(u.email)) return null;
  return u;
}

/**
 * Admins de backoffice para notificações in-app de reservas: role ADMIN na BD + conta Super Admin (mesmo como USER).
 */
type ReservaNotifyRow = {
  id: string;
  email: string;
  name: string | null;
  emailNotifReservas: boolean;
};

export async function getAdminTeamForReservaNotify(): Promise<ReservaNotifyRow[]> {
  const [admins, superRow] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, emailNotifReservas: true },
    }),
    findSuperAdminUserRow(),
  ]);
  const map = new Map<string, ReservaNotifyRow>();
  for (const a of admins) {
    map.set(a.id, { ...a, name: a.name });
  }
  if (superRow) {
    map.set(superRow.id, {
      id: superRow.id,
      email: superRow.email,
      name: superRow.name,
      emailNotifReservas: superRow.emailNotifReservas,
    });
  }
  return Array.from(map.values());
}

/** Destinatários de email para novo pedido de reserva: admins com preferência + Super Admin sempre. */
export function collectReservaNotifyEmails(
  team: { email: string; emailNotifReservas: boolean }[]
): string[] {
  const set = new Set<string>();
  for (const t of team) {
    if (!t.email) continue;
    if (t.emailNotifReservas || isSuperAdminEmail(t.email)) set.add(t.email);
  }
  return [...set];
}

/** Emails para formulário de contacto: admins com notificação ativa + Super Admin sempre. */
export async function getContactFormAdminEmails(): Promise<string[]> {
  const [admins, superRow] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN", emailNotifContacto: true },
      select: { email: true },
    }),
    findSuperAdminUserRow(),
  ]);
  const set = new Set<string>();
  for (const a of admins) {
    if (a.email) set.add(a.email);
  }
  if (superRow?.email) set.add(superRow.email);
  return [...set];
}
