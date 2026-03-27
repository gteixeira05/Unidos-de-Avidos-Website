import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { countEffectiveAdminsExcluding } from "@/lib/admin-effective-count";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { logAdminAction } from "@/lib/admin-audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  if (!id) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  if (id === session.id) {
    return Response.json({ error: "Não pode eliminar o seu próprio utilizador." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!user) return Response.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (isSuperAdminEmail(user.email)) {
    return Response.json({ error: "Não é possível eliminar o Super Admin." }, { status: 400 });
  }

  if (user.role === "ADMIN") {
    const remaining = await countEffectiveAdminsExcluding(id);
    if (remaining === 0) {
      return Response.json({ error: "Não é possível eliminar o último administrador." }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id } });
  await logAdminAction(session, {
    action: "USER_DELETE",
    entityType: "USER",
    entityId: id,
    description: `Eliminou utilizador ${user.email}.`,
    metadata: { userId: id, email: user.email, role: user.role },
  });
  return Response.json({ success: true });
}
