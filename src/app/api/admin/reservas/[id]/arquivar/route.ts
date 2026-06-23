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
  if (!id) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const arquivada = Boolean(body?.arquivada);

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      roupa: { select: { tema: true, ano: true } },
    },
  });

  if (!reserva) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  const updated = await prisma.reserva.update({
    where: { id },
    data: { arquivada },
    select: { id: true, arquivada: true },
  });

  await logAdminAction(session, {
    action: arquivada ? "RESERVA_ARQUIVAR" : "RESERVA_DESARQUIVAR",
    entityType: "RESERVA",
    entityId: id,
    description: `${arquivada ? "Arquivou" : "Desarquivou"} a reserva ${id} (${reserva.roupa.tema} ${reserva.roupa.ano}) ${new Date(reserva.dataInicio).toISOString().slice(0, 10)}→${new Date(reserva.dataFim).toISOString().slice(0, 10)}.`,
    metadata: {
      reservaId: id,
      roupaAno: reserva.roupa.ano,
      roupaTema: reserva.roupa.tema,
      arquivada,
    },
  });

  return Response.json({ success: true, reserva: updated });
}
