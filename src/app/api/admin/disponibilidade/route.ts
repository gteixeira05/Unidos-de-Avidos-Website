import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { addDays } from "date-fns";
import { logAdminAction } from "@/lib/admin-audit";

function toDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Início do dia em UTC, alinhado a data `YYYY-MM-DD` guardada com `T00:00:00.000Z`. */
function toUTCDay(d: Date) {
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

/** A reserva cobre o dia (UTC) `d` (início) segundo o mesmo critério que a eliminação de reservas. */
function reservaCobreInicioDia(
  d: Date,
  r: { dataInicio: Date; dataFim: Date }
) {
  const next = addDays(d, 1);
  return r.dataInicio < next && r.dataFim >= d;
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const roupaId = (body?.roupaId ?? "").toString();
  const inicioRaw = body?.inicio;
  const fimRaw = body?.fim;
  const estado = (body?.estado ?? "").toString();
  const reservaIdParaEliminar = body?.reservaId?.toString?.() ?? "";
  const aluguerManual = body?.aluguerManual as
    | { nome?: string; email?: string; telefone?: string; observacoes?: string }
    | undefined;

  if (!roupaId || !inicioRaw || !fimRaw || !["LIVRE", "ALUGADA", "MANUTENCAO"].includes(estado)) {
    return Response.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  function parseDay(raw: unknown): Date | null {
    const s = raw?.toString?.();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(`${s}T00:00:00.000Z`);
    }
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  const inicio = parseDay(inicioRaw);
  const fim = parseDay(fimRaw);
  if (!inicio || !fim || inicio > fim) {
    return Response.json({ error: "Intervalo inválido." }, { status: 400 });
  }

  const inicioKey = toDayKey(inicio);
  const fimKey = toDayKey(fim);

  const roupaInfo = await prisma.roupa.findUnique({
    where: { id: roupaId },
    select: { id: true, ano: true, tema: true },
  });

  // Libertar calendário e remover reserva APROVADA associada (ex.: admin “Eliminar (livre)”)
  if (estado === "LIVRE" && reservaIdParaEliminar) {
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaIdParaEliminar, roupaId, estado: "APROVADA" },
      select: { id: true, dataInicio: true, dataFim: true },
    });
    if (!reserva) {
      return Response.json({ error: "Reserva aprovada não encontrada." }, { status: 404 });
    }
    const rIni = toDayKey(reserva.dataInicio);
    const rFim = toDayKey(reserva.dataFim);
    if (rIni !== inicioKey || rFim !== fimKey) {
      return Response.json(
        { error: "O intervalo não coincide com a reserva a eliminar." },
        { status: 400 }
      );
    }
    await prisma.reserva.delete({ where: { id: reserva.id } });
  }

  if (estado === "ALUGADA") {
    const conflitos = await prisma.disponibilidade.findMany({
      where: {
        roupaId,
        estado: { in: ["ALUGADA", "MANUTENCAO"] },
        data: { gte: inicio, lte: fim },
      },
      select: { data: true, estado: true },
      orderBy: { data: "asc" },
    });

    // Só contar ALUGADA no calendário se houver reserva APROVADA a cobrir o dia. Caso contrário
    // é estado órfão (ex.: apagou a reserva mas ficou lixo/duplicado em disponibilidade), e
    // pode ser substituído. MANUTENCAO continua a bloquear sempre.
    const aprovadas = await prisma.reserva.findMany({
      where: { roupaId, estado: "APROVADA" },
      select: { dataInicio: true, dataFim: true },
    });
    const conflitosReais = conflitos.filter((c) => {
      if (c.estado === "MANUTENCAO") return true;
      const d = toUTCDay(c.data);
      return aprovadas.some((r) => reservaCobreInicioDia(d, r));
    });

    if (conflitosReais.length > 0) {
      return Response.json(
        {
          error:
            "As datas selecionadas já estão ocupadas (alugadas/manutenção). Escolha outro intervalo.",
          conflitos: conflitosReais.map((c) => ({
            data: c.data.toISOString().slice(0, 10),
            estado: c.estado,
          })),
        },
        { status: 409 }
      );
    }

    // Reserva criada pelo admin (como pedido de utilizador) — obrigatório para novo aluguer manual
    if (aluguerManual) {
      const nome = (aluguerManual.nome ?? "").toString().trim();
      const email = (aluguerManual.email ?? "").toString().trim();
      const telefone = (aluguerManual.telefone ?? "").toString().trim();
      const observacoes = (aluguerManual.observacoes ?? "").toString().trim() || null;
      if (!nome || !telefone) {
        return Response.json(
          { error: "Para marcar como ALUGADA preencha nome e telefone (email é opcional)." },
          { status: 400 }
        );
      }

      const sobreposicaoReserva = await prisma.reserva.findFirst({
        where: {
          roupaId,
          estado: { in: ["PENDENTE", "APROVADA"] },
          dataInicio: { lte: fim },
          dataFim: { gte: inicio },
        },
        select: { id: true },
      });
      if (sobreposicaoReserva) {
        return Response.json(
          { error: "Já existe uma reserva (pendente ou aprovada) neste intervalo." },
          { status: 409 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.reserva.create({
          data: {
            roupaId,
            userId: null,
            dataInicio: inicio,
            dataFim: fim,
            estado: "APROVADA",
            quantidadeHomem: 0,
            quantidadeMulher: 0,
            nome,
            email: email || null,
            telefone,
            observacoes,
          },
        });

        for (let d = inicio; d <= fim; d = addDays(d, 1)) {
          const next = addDays(d, 1);
          const updated = await tx.disponibilidade.updateMany({
            where: { roupaId, data: { gte: d, lt: next } },
            data: { estado: "ALUGADA" },
          });
          if (updated.count === 0) {
            await tx.disponibilidade.create({ data: { roupaId, data: d, estado: "ALUGADA" } });
          }
        }
      });

      await logAdminAction(session, {
        action: "DISPONIBILIDADE_SET_ALUGADA",
        entityType: "DISPONIBILIDADE",
        entityId: roupaId,
        description: `Marcou como ALUGADA (manual) a roupa ${roupaInfo?.tema ?? "—"} (${roupaInfo?.ano ?? "—"}) de ${inicioKey} até ${fimKey}.`,
        metadata: {
          roupaId,
          ano: roupaInfo?.ano,
          tema: roupaInfo?.tema,
          inicio: inicioKey,
          fim: fimKey,
          estado: "ALUGADA",
          kind: "manual",
        },
      });

      return Response.json({ success: true });
    }
  }

  for (let d = inicio; d <= fim; d = addDays(d, 1)) {
    const next = addDays(d, 1);
    const updated = await prisma.disponibilidade.updateMany({
      where: { roupaId, data: { gte: d, lt: next } },
      data: { estado },
    });
    if (updated.count === 0) {
      await prisma.disponibilidade.create({ data: { roupaId, data: d, estado } });
    }
  }
  await logAdminAction(session, {
    action: "DISPONIBILIDADE_UPDATE",
    entityType: "DISPONIBILIDADE",
    entityId: roupaId,
    description: `Atualizou disponibilidade para ${estado} na roupa ${roupaInfo?.tema ?? "—"} (${roupaInfo?.ano ?? "—"}) de ${inicioKey} até ${fimKey}.`,
    metadata: { roupaId, ano: roupaInfo?.ano, tema: roupaInfo?.tema, inicio: inicioKey, fim: fimKey, estado },
  });
  return Response.json({ success: true });
}
