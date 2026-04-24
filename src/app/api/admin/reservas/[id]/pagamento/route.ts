import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import {
  normalizePagamentoEstado,
  parseMetodoPagamento,
  PAGAMENTO_ESTADOS,
} from "@/lib/reservaPagamento";

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
  const peRaw = (body?.pagamentoEstado ?? "").toString().trim();
  if (!PAGAMENTO_ESTADOS.includes(peRaw as (typeof PAGAMENTO_ESTADOS)[number])) {
    return Response.json({ error: "Estado de pagamento inválido." }, { status: 400 });
  }
  const pagamentoEstado = peRaw as (typeof PAGAMENTO_ESTADOS)[number];

  let metodoPagamento: string | null = null;
  if (pagamentoEstado === "PAGO") {
    const mp = parseMetodoPagamento(body?.metodoPagamento);
    if (!mp) {
      return Response.json(
        {
          error:
            "Quando a reserva está paga, escolha o método: dinheiro físico ou transferência bancária.",
        },
        { status: 400 }
      );
    }
    metodoPagamento = mp;
  }

  const atual = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      pagamentoEstado: true,
      metodoPagamento: true,
      dataInicio: true,
      dataFim: true,
      roupa: { select: { id: true, ano: true, tema: true } },
    },
  });
  if (!atual) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }
  if (atual.estado !== "APROVADA") {
    return Response.json(
      { error: "Só é possível definir pagamento em reservas aprovadas (alugadas)." },
      { status: 400 }
    );
  }

  const updated = await prisma.reserva.update({
    where: { id },
    data: { pagamentoEstado, metodoPagamento },
    select: {
      id: true,
      estado: true,
      pagamentoEstado: true,
      metodoPagamento: true,
      dataInicio: true,
      dataFim: true,
      nome: true,
      email: true,
      telefone: true,
      observacoes: true,
      incluiCalcado: true,
      custoExtraCalcado: true,
      user: { select: { id: true, name: true, email: true } },
      roupa: { select: { id: true, ano: true, tema: true, precoAluguer: true } },
    },
  });

  const prevPe = normalizePagamentoEstado(atual.pagamentoEstado);
  const changes: { field: string; from: unknown; to: unknown }[] = [];
  if (prevPe !== pagamentoEstado) {
    changes.push({ field: "pagamentoEstado", from: prevPe, to: pagamentoEstado });
  }
  if ((atual.metodoPagamento ?? null) !== metodoPagamento) {
    changes.push({ field: "metodoPagamento", from: atual.metodoPagamento ?? null, to: metodoPagamento });
  }

  await logAdminAction(session, {
    action: "RESERVA_PAGAMENTO_UPDATE",
    entityType: "RESERVA",
    entityId: updated.id,
    description: `Atualizou pagamento da reserva ${updated.id} (${updated.roupa.tema} ${updated.roupa.ano}): ${pagamentoEstado}${metodoPagamento ? ` (${metodoPagamento})` : ""}.`,
    metadata: {
      reservaId: updated.id,
      roupaId: updated.roupa.id,
      changes,
    },
  });

  return Response.json({ success: true, reserva: updated });
}
