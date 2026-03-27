import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";

/** Conta utilizadores que têm acesso de administração (ADMIN na BD ou email de Super Admin). */
function isEffectiveAdminRow(u: { role: string; email: string }): boolean {
  return u.role === "ADMIN" || isSuperAdminEmail(u.email);
}

/**
 * Quantos administradores efetivos ficam se excluirmos este id (útil antes de eliminar ou despromover um ADMIN).
 */
export async function countEffectiveAdminsExcluding(excludeUserId: string): Promise<number> {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { role: true, email: true },
  });
  return users.filter((u) => isEffectiveAdminRow(u)).length;
}
