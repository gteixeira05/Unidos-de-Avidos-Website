import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const aprovada = Boolean(body?.aprovada);

  const existing = await prisma.avaliacao.findUnique({
    where: { id },
    select: { id: true, nota: true, user: { select: { name: true } } },
  });
  if (!existing) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });

  const updated = await prisma.avaliacao.update({
    where: { id },
    data: { aprovada },
    select: { id: true, nota: true, comentario: true, aprovada: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
  });

  await logAdminAction(session, {
    action: aprovada ? "AVALIACAO_APROVAR" : "AVALIACAO_REJEITAR",
    entityType: "AVALIACAO",
    entityId: id,
    description: `${aprovada ? "Aprovou" : "Rejeitou"} avaliação de ${existing.user.name} (${existing.nota} estrelas).`,
    metadata: { avaliacaoId: id, nota: existing.nota, aprovada },
  });

  return Response.json({ success: true, avaliacao: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.avaliacao.findUnique({
    where: { id },
    select: { id: true, nota: true, user: { select: { name: true } } },
  });
  if (!existing) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });

  await prisma.avaliacao.delete({ where: { id } });

  await logAdminAction(session, {
    action: "AVALIACAO_DELETE",
    entityType: "AVALIACAO",
    entityId: id,
    description: `Eliminou avaliação de ${existing.user.name} (${existing.nota} estrelas).`,
    metadata: { avaliacaoId: id, nota: existing.nota },
  });

  return Response.json({ success: true });
}
