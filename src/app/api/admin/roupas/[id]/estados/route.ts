import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

function toDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id: roupaId } = await params;
  if (!roupaId) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  // ALUGADA: uma linha por reserva APROVADA (não fundir intervalos contíguos no calendário)
  const aprovadas = await prisma.reserva.findMany({
    where: { roupaId, estado: "APROVADA" },
    orderBy: { dataInicio: "asc" },
    select: {
      id: true,
      dataInicio: true,
      dataFim: true,
      user: { select: { name: true, email: true } },
      nome: true,
      email: true,
      telefone: true,
      observacoes: true,
      pagamentoEstado: true,
      metodoPagamento: true,
    },
  });

  const pendentes = await prisma.reserva.findMany({
    where: { roupaId, estado: "PENDENTE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      dataInicio: true,
      dataFim: true,
      user: { select: { name: true, email: true } },
      nome: true,
      email: true,
      telefone: true,
      observacoes: true,
    },
  });

  return Response.json({
    alugadas: aprovadas.map((r) => ({
      reservaId: r.id,
      inicio: toDayKey(r.dataInicio),
      fim: toDayKey(r.dataFim),
      nome: r.user?.name ?? r.nome ?? null,
      email: r.user?.email ?? r.email ?? null,
      telefone: r.telefone ?? null,
      observacoes: r.observacoes ?? null,
      pagamentoEstado: r.pagamentoEstado ?? "POR_PAGAR",
      metodoPagamento: r.metodoPagamento ?? null,
    })),
    pendentes: pendentes.map((p) => ({
      id: p.id,
      inicio: toDayKey(p.dataInicio),
      fim: toDayKey(p.dataFim),
      nome: p.user?.name ?? p.nome ?? null,
      email: p.user?.email ?? p.email ?? null,
      telefone: p.telefone ?? null,
      observacoes: p.observacoes ?? null,
    })),
  });
}
