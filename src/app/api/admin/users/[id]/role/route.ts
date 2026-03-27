import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { logAdminAction } from "@/lib/admin-audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const role = (body?.role ?? "").toString();
  if (!id || !["USER", "ADMIN"].includes(role)) {
    return Response.json({ error: "Role inválida." }, { status: 400 });
  }
  if (id === session.id) {
    return Response.json({ error: "Não pode alterar o seu próprio role." }, { status: 400 });
  }

  // Proteção: não permitir remover o último admin
  if (role === "USER") {
    const current = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (current?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return Response.json({ error: "Não é possível remover o último administrador." }, { status: 400 });
      }
    }
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });
  if (!target) return Response.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (isSuperAdminEmail(target.email)) {
    return Response.json({ error: "Não é possível alterar o role do Super Admin." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  await logAdminAction(session, {
    action: "USER_ROLE_UPDATE",
    entityType: "USER",
    entityId: user.id,
    description: `Alterou role de ${user.email} para ${user.role}.`,
    metadata: { userId: user.id, email: user.email, name: user.name, role: user.role },
  });

  return Response.json({ success: true, user });
}

