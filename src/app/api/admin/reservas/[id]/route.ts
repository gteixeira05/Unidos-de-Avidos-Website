import { NextRequest } from "next/server";
import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/admin-audit";
import {
  PAGAMENTO_ESTADOS,
  parseMetodoPagamento,
} from "@/lib/reservaPagamento";
import {
  getPrecoCalcadoPorAno,
  temCalcadoDisponivel,
  isPosEvento2026,
  PRECO_CALCADO_POS_EVENTO_2026,
  PRECO_ARCOS_POS_EVENTO_2026,
} from "@/lib/aluguerRoupasPublic";

function toUTCDay(d: Date) {
  const s = d.toISOString().split("T")[0]!;
  return new Date(`${s}T00:00:00.000Z`);
}

function dayKeyUTC(d: Date) {
  return toUTCDay(d).toISOString().split("T")[0]!;
}

/** Mesmo critério que o loop antigo: outra reserva cobre o dia [d, next). */
function reservaCobreDia(
  d: Date,
  next: Date,
  dataInicio: Date,
  dataFim: Date
) {
  return dataInicio < next && dataFim >= d;
}

/**
 * Liberta (ALUGADA → LIVRE) os dias de [inicio, fim] desta roupa que não estão
 * cobertos por OUTRA reserva aprovada. Preserva MANUTENCAO. Usado quando uma
 * reserva aprovada muda de datas/estado, para o calendário não ficar dessincronizado.
 */
async function liberarDiasIntervalo(
  tx: Prisma.TransactionClient,
  roupaId: string,
  reservaIdExcluir: string,
  inicio: Date,
  fim: Date
) {
  const dInicio = toUTCDay(inicio);
  const dFim = toUTCDay(fim);

  const [outrasReservas, dispRows] = await Promise.all([
    tx.reserva.findMany({
      where: {
        id: { not: reservaIdExcluir },
        roupaId,
        estado: "APROVADA",
        dataInicio: { lt: addDays(dFim, 1) },
        dataFim: { gte: dInicio },
      },
      select: { dataInicio: true, dataFim: true },
    }),
    tx.disponibilidade.findMany({
      where: { roupaId, data: { gte: dInicio, lte: dFim } },
      select: { id: true, data: true, estado: true },
    }),
  ]);

  const dispPorDia = new Map<string, { id: string; estado: string }>();
  for (const row of dispRows) {
    dispPorDia.set(dayKeyUTC(row.data), { id: row.id, estado: row.estado });
  }

  const idsAlugadaParaLivre: string[] = [];
  for (let d = dInicio; d <= dFim; d = addDays(d, 1)) {
    const next = addDays(d, 1);
    const cobertoPorOutra = outrasReservas.some((r) =>
      reservaCobreDia(d, next, r.dataInicio, r.dataFim)
    );
    if (cobertoPorOutra) continue;
    const existente = dispPorDia.get(dayKeyUTC(d));
    if (existente?.estado === "ALUGADA") {
      idsAlugadaParaLivre.push(existente.id);
    }
  }

  if (idsAlugadaParaLivre.length > 0) {
    await tx.disponibilidade.updateMany({
      where: { id: { in: idsAlugadaParaLivre }, estado: "ALUGADA" },
      data: { estado: "LIVRE" },
    });
  }
}

/**
 * Ocupa (marca ALUGADA) os dias de [inicio, fim] desta roupa. Cria linhas em falta,
 * promove LIVRE → ALUGADA e nunca sobrepõe MANUTENCAO.
 */
async function ocuparDiasIntervalo(
  tx: Prisma.TransactionClient,
  roupaId: string,
  inicio: Date,
  fim: Date
) {
  const dInicio = toUTCDay(inicio);
  const dFim = toUTCDay(fim);

  const existing = await tx.disponibilidade.findMany({
    where: { roupaId, data: { gte: dInicio, lte: dFim } },
    select: { id: true, data: true, estado: true },
  });
  const porDia = new Map<string, { id: string; estado: string }>();
  for (const row of existing) {
    porDia.set(dayKeyUTC(row.data), { id: row.id, estado: row.estado });
  }

  const idsParaAlugada: string[] = [];
  const criar: { roupaId: string; data: Date; estado: string }[] = [];
  for (let d = dInicio; d <= dFim; d = addDays(d, 1)) {
    const row = porDia.get(dayKeyUTC(d));
    if (row) {
      if (row.estado === "LIVRE") idsParaAlugada.push(row.id);
      // MANUTENCAO ou já ALUGADA: não tocar
    } else {
      criar.push({ roupaId, data: d, estado: "ALUGADA" });
    }
  }

  if (idsParaAlugada.length > 0) {
    await tx.disponibilidade.updateMany({
      where: { id: { in: idsParaAlugada }, estado: "LIVRE" },
      data: { estado: "ALUGADA" },
    });
  }
  if (criar.length > 0) {
    await tx.disponibilidade.createMany({ data: criar });
  }
}

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

  const estado = (body?.estado ?? "").toString();
  const dataInicioRaw = (body?.dataInicio ?? "").toString();
  const dataFimRaw = (body?.dataFim ?? "").toString();
  const nome = (body?.nome ?? "").toString().trim() || null;
  const email = (body?.email ?? "").toString().trim() || null;
  const telefone = (body?.telefone ?? "").toString().trim() || null;
  const observacoes = (body?.observacoes ?? "").toString().trim() || null;
  const hasIncluiCalcadoInBody =
    body && typeof body === "object" && "incluiCalcado" in body;
  const hasIncluiArcosInBody =
    body && typeof body === "object" && "incluiArcos" in body;

  const hasPagamentoInBody =
    body && typeof body === "object" && "pagamentoEstado" in body;
  let pagamentoPatch: { pagamentoEstado: string; metodoPagamento: string | null } | null = null;
  if (hasPagamentoInBody) {
    const peRaw = (body.pagamentoEstado ?? "").toString().trim();
    if (!PAGAMENTO_ESTADOS.includes(peRaw as (typeof PAGAMENTO_ESTADOS)[number])) {
      return Response.json({ error: "Estado de pagamento inválido." }, { status: 400 });
    }
    if (peRaw === "PAGO") {
      const mp = parseMetodoPagamento(body.metodoPagamento);
      if (!mp) {
        return Response.json(
          {
            error:
              "Quando a reserva está paga, escolha o método: dinheiro físico ou transferência bancária.",
          },
          { status: 400 }
        );
      }
      pagamentoPatch = { pagamentoEstado: peRaw, metodoPagamento: mp };
    } else {
      pagamentoPatch = { pagamentoEstado: peRaw, metodoPagamento: null };
    }
  }

  if (!["PENDENTE", "APROVADA", "REJEITADA", "CANCELADA"].includes(estado)) {
    return Response.json({ error: "Estado inválido." }, { status: 400 });
  }

  const dataInicio = new Date(dataInicioRaw);
  const dataFim = new Date(dataFimRaw);
  if (
    Number.isNaN(dataInicio.getTime()) ||
    Number.isNaN(dataFim.getTime()) ||
    dataInicio > dataFim
  ) {
    return Response.json({ error: "Período inválido." }, { status: 400 });
  }

  const reservaAtual = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      roupaId: true,
      userId: true,
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
      roupa: {
        select: {
          id: true,
          ano: true,
          tema: true,
          precoAluguer: true,
        },
      },
    },
  });
  if (!reservaAtual) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  if (estado === "APROVADA") {
    const [conflito, manutencao] = await Promise.all([
      prisma.reserva.findFirst({
        where: {
          id: { not: id },
          roupaId: reservaAtual.roupaId,
          estado: "APROVADA",
          dataInicio: { lte: dataFim },
          dataFim: { gte: dataInicio },
        },
        select: { id: true },
      }),
      prisma.disponibilidade.findFirst({
        where: {
          roupaId: reservaAtual.roupaId,
          estado: "MANUTENCAO",
          data: { gte: toUTCDay(dataInicio), lte: toUTCDay(dataFim) },
        },
        select: { id: true },
      }),
    ]);
    if (conflito) {
      return Response.json(
        { error: "Já existe outra reserva aprovada a ocupar este período." },
        { status: 409 }
      );
    }
    if (manutencao) {
      return Response.json(
        { error: "Não é possível: há dias marcados como manutenção neste período." },
        { status: 409 }
      );
    }
  }

  const paymentData =
    estado === "APROVADA"
      ? pagamentoPatch
        ? {
            pagamentoEstado: pagamentoPatch.pagamentoEstado,
            metodoPagamento: pagamentoPatch.metodoPagamento,
          }
        : {}
      : { pagamentoEstado: "POR_PAGAR", metodoPagamento: null as string | null };

  const posEvento = isPosEvento2026(reservaAtual.roupa.ano, dataInicioRaw);
  const ano2026PreEvento = reservaAtual.roupa.ano === 2026 && !posEvento;

  const calcadoData: { incluiCalcado: boolean; custoExtraCalcado: number } | Record<string, never> =
    hasIncluiCalcadoInBody
      ? (() => {
          const incluir = Boolean(body.incluiCalcado);
          if (!incluir) return { incluiCalcado: false, custoExtraCalcado: 0 };
          if (posEvento) return { incluiCalcado: true, custoExtraCalcado: PRECO_CALCADO_POS_EVENTO_2026 };
          if (ano2026PreEvento) return { incluiCalcado: true, custoExtraCalcado: 0 };
          if (!temCalcadoDisponivel(reservaAtual.roupa.ano)) return { incluiCalcado: false, custoExtraCalcado: 0 };
          return { incluiCalcado: true, custoExtraCalcado: getPrecoCalcadoPorAno(reservaAtual.roupa.ano) ?? 0 };
        })()
      : {};

  const arcosData: { incluiArcos: boolean; custoExtraArcos: number } | Record<string, never> =
    hasIncluiArcosInBody
      ? (() => {
          const incluir = Boolean(body.incluiArcos);
          if (!incluir) return { incluiArcos: false, custoExtraArcos: 0 };
          if (posEvento) return { incluiArcos: true, custoExtraArcos: PRECO_ARCOS_POS_EVENTO_2026 };
          if (ano2026PreEvento) return { incluiArcos: true, custoExtraArcos: 0 };
          return { incluiArcos: false, custoExtraArcos: 0 };
        })()
      : {};

  const eraAprovada = reservaAtual.estado === "APROVADA";
  const ficaAprovada = estado === "APROVADA";

  const updated = await prisma.$transaction(
    async (tx) => {
      // Se a reserva estava aprovada, libertar primeiro os dias ANTIGOS (senão ficam presos no calendário).
      if (eraAprovada) {
        await liberarDiasIntervalo(
          tx,
          reservaAtual.roupaId,
          id,
          reservaAtual.dataInicio,
          reservaAtual.dataFim
        );
      }

      const u = await tx.reserva.update({
        where: { id },
        data: {
          estado,
          dataInicio,
          dataFim,
          nome,
          email,
          telefone,
          observacoes,
          ...calcadoData,
          ...arcosData,
          ...paymentData,
        },
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
          user: { select: { id: true, name: true, email: true } },
          roupa: { select: { id: true, ano: true, tema: true, precoAluguer: true } },
        },
      });

      // Se a reserva fica aprovada, ocupar os dias NOVOS.
      if (ficaAprovada) {
        await ocuparDiasIntervalo(tx, reservaAtual.roupaId, dataInicio, dataFim);
      }

      return u;
    },
    { maxWait: 10_000, timeout: 60_000 }
  );

  if (updated.user?.id && reservaAtual.estado !== estado) {
    await prisma.notification.create({
      data: {
        userId: updated.user.id,
        type: "RESERVA_ATUALIZADA",
        title: "Atualização do seu pedido de reserva",
        body: `O seu pedido para ${updated.roupa.tema} (${updated.roupa.ano}) foi ${estado.toLowerCase()}.`,
        href: "/perfil#sec-notificacoes",
      },
    });

    if (updated.user.email) {
      const inicioFmt = new Date(updated.dataInicio).toLocaleDateString("pt-PT");
      const fimFmt = new Date(updated.dataFim).toLocaleDateString("pt-PT");
      const baseUrl = process.env.APP_URL ?? "";
      await sendEmail({
        to: [updated.user.email],
        subject: `Reserva ${estado.toLowerCase()} — ${updated.roupa.tema} (${updated.roupa.ano})`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.4">
            <p>Olá${updated.user.name ? `, ${updated.user.name}` : ""}.</p>
            <p>O seu pedido de reserva para <strong>${updated.roupa.tema} (${updated.roupa.ano})</strong> foi <strong>${estado.toLowerCase()}</strong>.</p>
            <p><strong>Período:</strong> ${inicioFmt} → ${fimFmt}</p>
            <p><a href="${baseUrl}/perfil#sec-notificacoes">Ver no site</a></p>
          </div>
        `,
      });
    }
  }

  const changes: { field: string; from: unknown; to: unknown }[] = [];
  const prev = reservaAtual;
  const next = updated;
  const pushIfChanged = (field: string, from: unknown, to: unknown) => {
    if (Object.is(from, to)) return;
    changes.push({ field, from, to });
  };
  pushIfChanged("estado", prev.estado, next.estado);
  pushIfChanged("dataInicio", prev.dataInicio?.toISOString?.() ?? prev.dataInicio, next.dataInicio);
  pushIfChanged("dataFim", prev.dataFim?.toISOString?.() ?? prev.dataFim, next.dataFim);
  pushIfChanged("nome", prev.nome ?? null, next.nome ?? null);
  pushIfChanged("email", prev.email ?? null, next.email ?? null);
  pushIfChanged("telefone", prev.telefone ?? null, next.telefone ?? null);
  pushIfChanged("observacoes", prev.observacoes ?? null, next.observacoes ?? null);
  pushIfChanged("incluiCalcado", prev.incluiCalcado ?? false, next.incluiCalcado ?? false);
  pushIfChanged("custoExtraCalcado", prev.custoExtraCalcado ?? 0, next.custoExtraCalcado ?? 0);
  pushIfChanged("incluiArcos", prev.incluiArcos ?? false, next.incluiArcos ?? false);
  pushIfChanged("custoExtraArcos", prev.custoExtraArcos ?? 0, next.custoExtraArcos ?? 0);
  pushIfChanged("pagamentoEstado", prev.pagamentoEstado ?? "POR_PAGAR", next.pagamentoEstado ?? "POR_PAGAR");
  pushIfChanged("metodoPagamento", prev.metodoPagamento ?? null, next.metodoPagamento ?? null);

  const changesSummary =
    changes.length > 0
      ? ` Alterações: ${changes
          .slice(0, 6)
          .map((c) => `${c.field}: ${String(c.from)} → ${String(c.to)}`)
          .join(", ")}${changes.length > 6 ? ` (+${changes.length - 6})` : ""}.`
      : "";

  await logAdminAction(session, {
    action: "RESERVA_UPDATE",
    entityType: "RESERVA",
    entityId: updated.id,
    description: `Editou a reserva ${updated.id} (${updated.roupa.tema} ${updated.roupa.ano}) ${new Date(
      updated.dataInicio
    ).toISOString().slice(0, 10)}→${new Date(updated.dataFim).toISOString().slice(0, 10)}.${changesSummary}`,
    metadata: {
      reservaId: updated.id,
      roupaId: updated.roupa.id,
      roupaAno: updated.roupa.ano,
      roupaTema: updated.roupa.tema,
      userId: updated.user?.id ?? null,
      estado,
      changes,
    },
  });

  return Response.json({ success: true, reserva: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  if (!id) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      roupaId: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      roupa: { select: { tema: true, ano: true } },
    },
  });

  if (!reserva) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  await prisma.$transaction(
    async (tx) => {
      if (reserva.estado === "APROVADA") {
        const inicio = new Date(reserva.dataInicio);
        const fim = new Date(reserva.dataFim);
        const dInicio = toUTCDay(inicio);
        const dFim = toUTCDay(fim);

        // Uma query para sobreposições + uma para disponibilidades (evita timeout em períodos longos)
        const [outrasReservas, dispRows] = await Promise.all([
          tx.reserva.findMany({
            where: {
              id: { not: reserva.id },
              roupaId: reserva.roupaId,
              estado: "APROVADA",
              dataInicio: { lt: addDays(dFim, 1) },
              dataFim: { gte: dInicio },
            },
            select: { dataInicio: true, dataFim: true },
          }),
          tx.disponibilidade.findMany({
            where: {
              roupaId: reserva.roupaId,
              data: { gte: dInicio, lte: dFim },
            },
            select: { id: true, data: true, estado: true },
          }),
        ]);

        const dispPorDia = new Map<string, { id: string; estado: string }>();
        for (const row of dispRows) {
          dispPorDia.set(dayKeyUTC(row.data), { id: row.id, estado: row.estado });
        }

        const idsAlugadaParaLivre: string[] = [];
        const criarLivre: { roupaId: string; data: Date; estado: string }[] = [];

        for (let d = dInicio; d <= dFim; d = addDays(d, 1)) {
          const next = addDays(d, 1);
          const cobertoPorOutra = outrasReservas.some((r) =>
            reservaCobreDia(d, next, r.dataInicio, r.dataFim)
          );
          if (cobertoPorOutra) continue;

          const key = dayKeyUTC(d);
          const existente = dispPorDia.get(key);
          if (existente?.estado === "MANUTENCAO") continue;

          if (existente?.estado === "ALUGADA") {
            idsAlugadaParaLivre.push(existente.id);
          } else if (!existente) {
            criarLivre.push({ roupaId: reserva.roupaId, data: d, estado: "LIVRE" });
          }
        }

        if (idsAlugadaParaLivre.length > 0) {
          await tx.disponibilidade.updateMany({
            where: { id: { in: idsAlugadaParaLivre }, estado: "ALUGADA" },
            data: { estado: "LIVRE" },
          });
        }
        if (criarLivre.length > 0) {
          await tx.disponibilidade.createMany({ data: criarLivre });
        }
      }

      await tx.reserva.delete({ where: { id } });
    },
    {
      maxWait: 10_000,
      timeout: 60_000,
    }
  );

  await logAdminAction(session, {
    action: "RESERVA_DELETE",
    entityType: "RESERVA",
    entityId: id,
    description: `Eliminou a reserva ${id} (${reserva.roupa.tema} ${reserva.roupa.ano}) ${new Date(
      reserva.dataInicio
    ).toISOString().slice(0, 10)}→${new Date(reserva.dataFim).toISOString().slice(0, 10)}.`,
    metadata: {
      reservaId: id,
      roupaId: reserva.roupaId,
      roupaAno: reserva.roupa.ano,
      roupaTema: reserva.roupa.tema,
      estado: reserva.estado,
      dataInicio: reserva.dataInicio,
      dataFim: reserva.dataFim,
    },
  });

  return Response.json({ success: true });
}

