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

  const caucaoPaga = Boolean(body?.caucaoPaga);
  // A devolução só faz sentido se a caução tiver sido paga.
  const caucaoDevolvida = caucaoPaga ? Boolean(body?.caucaoDevolvida) : false;

  let caucaoDevolvidaEm: Date | null = null;
  if (caucaoDevolvida) {
    const raw = (body?.caucaoDevolvidaEm ?? "").toString().trim();
    const parsed = raw ? new Date(raw) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return Response.json(
        { error: "Indique uma data de devolução válida da caução." },
        { status: 400 }
      );
    }
    caucaoDevolvidaEm = parsed;
  }

  const atual = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      caucaoPaga: true,
      caucaoDevolvida: true,
      caucaoDevolvidaEm: true,
      roupa: { select: { id: true, ano: true, tema: true } },
    },
  });
  if (!atual) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }
  if (atual.estado !== "APROVADA") {
    return Response.json(
      { error: "Só é possível gerir a caução em reservas aprovadas (alugadas)." },
      { status: 400 }
    );
  }

  const updated = await prisma.reserva.update({
    where: { id },
    data: { caucaoPaga, caucaoDevolvida, caucaoDevolvidaEm },
    select: {
      id: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      nome: true,
      email: true,
      telefone: true,
      observacoes: true,
      incluiCalcado: true,
      custoExtraCalcado: true,
      incluiArcos: true,
      custoExtraArcos: true,
      pagamentoEstado: true,
      metodoPagamento: true,
      caucaoPaga: true,
      caucaoDevolvida: true,
      caucaoDevolvidaEm: true,
      arquivada: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      roupa: { select: { id: true, ano: true, tema: true, precoAluguer: true } },
    },
  });

  const changes: { field: string; from: unknown; to: unknown }[] = [];
  if ((atual.caucaoPaga ?? false) !== caucaoPaga) {
    changes.push({ field: "caucaoPaga", from: atual.caucaoPaga ?? false, to: caucaoPaga });
  }
  if ((atual.caucaoDevolvida ?? false) !== caucaoDevolvida) {
    changes.push({ field: "caucaoDevolvida", from: atual.caucaoDevolvida ?? false, to: caucaoDevolvida });
  }
  const prevData = atual.caucaoDevolvidaEm ? atual.caucaoDevolvidaEm.toISOString() : null;
  const nextData = caucaoDevolvidaEm ? caucaoDevolvidaEm.toISOString() : null;
  if (prevData !== nextData) {
    changes.push({ field: "caucaoDevolvidaEm", from: prevData, to: nextData });
  }

  await logAdminAction(session, {
    action: "RESERVA_CAUCAO_UPDATE",
    entityType: "RESERVA",
    entityId: updated.id,
    description: `Atualizou a caução da reserva ${updated.id} (${updated.roupa.tema} ${updated.roupa.ano}): ${
      caucaoPaga ? "paga" : "por pagar"
    }${caucaoDevolvida ? `, devolvida em ${caucaoDevolvidaEm?.toISOString().slice(0, 10)}` : ", por devolver"}.`,
    metadata: {
      reservaId: updated.id,
      roupaId: updated.roupa.id,
      changes,
    },
  });

  return Response.json({ success: true, reserva: updated });
}
