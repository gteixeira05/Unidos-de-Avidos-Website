import { NextRequest } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/admin-audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const novoEstado = body?.estado as string | undefined;
  const adminNota = (body?.adminNota ?? "").toString().trim();

  if (!id || !novoEstado || !["PENDENTE", "APROVADA", "REJEITADA"].includes(novoEstado)) {
    return Response.json({ error: "Estado inválido." }, { status: 400 });
  }

  const reservaAtual = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      roupaId: true,
      dataInicio: true,
      dataFim: true,
      observacoes: true,
    },
  });
  if (!reservaAtual) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  if (novoEstado === "APROVADA") {
    const [reservaSobreposta, ocupacaoCalendario] = await Promise.all([
      prisma.reserva.findFirst({
        where: {
          id: { not: id },
          roupaId: reservaAtual.roupaId,
          estado: "APROVADA",
          dataInicio: { lte: reservaAtual.dataFim },
          dataFim: { gte: reservaAtual.dataInicio },
        },
        select: { id: true },
      }),
      prisma.disponibilidade.findFirst({
        where: {
          roupaId: reservaAtual.roupaId,
          estado: "MANUTENCAO",
          data: { gte: reservaAtual.dataInicio, lte: reservaAtual.dataFim },
        },
        select: { id: true },
      }),
    ]);

    if (reservaSobreposta || ocupacaoCalendario) {
      return Response.json(
        {
          error:
            "Não é possível aprovar: o intervalo já está ocupado por outra reserva aprovada ou em manutenção.",
        },
        { status: 409 }
      );
    }
  }

  const observacoesData =
    novoEstado === "APROVADA" && adminNota
      ? [reservaAtual.observacoes, adminNota].filter(Boolean).join("\n")
      : undefined;

  const reserva = await prisma.reserva.update({
    where: { id },
    data: {
      estado: novoEstado,
      ...(observacoesData !== undefined ? { observacoes: observacoesData } : {}),
    },
    select: {
      id: true,
      estado: true,
      userId: true,
      roupaId: true,
      dataInicio: true,
      dataFim: true,
      roupa: { select: { tema: true, ano: true } },
    },
  });

  // Ao aprovar, marcar o intervalo como ALUGADA na Disponibilidade
  if (novoEstado === "APROVADA") {
    const inicio = new Date(reserva.dataInicio);
    const fim = new Date(reserva.dataFim);
    // Normalizar para UTC midnight (YYYY-MM-DD → T00:00:00.000Z)
    const toUTCDay = (d: Date) => {
      const s = d.toISOString().split("T")[0]!;
      return new Date(`${s}T00:00:00.000Z`);
    };
    const dInicio = toUTCDay(inicio);
    const dFim = toUTCDay(fim);

    for (let d = dInicio; d <= dFim; d = addDays(d, 1)) {
      const next = addDays(d, 1);
      const updated = await prisma.disponibilidade.updateMany({
        where: { roupaId: reserva.roupaId, data: { gte: d, lt: next } },
        data: { estado: "ALUGADA" },
      });
      if (updated.count === 0) {
        await prisma.disponibilidade.create({
          data: { roupaId: reserva.roupaId, data: d, estado: "ALUGADA" },
        });
      }
    }
  }

  if (reserva.userId) {
    await prisma.notification.create({
      data: {
        userId: reserva.userId,
        type: "RESERVA_ATUALIZADA",
        title: "Atualização do seu pedido de reserva",
        body: `O seu pedido para ${reserva.roupa.tema} (${reserva.roupa.ano}) foi ${novoEstado.toLowerCase()}.`,
        href: "/perfil#sec-notificacoes",
      },
    });

    // Email: só envia se RESEND_API_KEY + domínio estiverem configurados (sendEmail ignora se não houver).
    const utilizador = await prisma.user.findUnique({
      where: { id: reserva.userId },
      select: { email: true, name: true },
    });
    if (utilizador?.email) {
      const inicio = new Date(reserva.dataInicio).toLocaleDateString("pt-PT");
      const fim = new Date(reserva.dataFim).toLocaleDateString("pt-PT");
      const baseUrl = process.env.APP_URL ?? "";
      await sendEmail({
        to: [utilizador.email],
        subject: `Reserva ${novoEstado.toLowerCase()} — ${reserva.roupa.tema} (${reserva.roupa.ano})`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.4">
            <p>Olá${utilizador.name ? `, ${utilizador.name}` : ""}.</p>
            <p>O seu pedido de reserva para <strong>${reserva.roupa.tema} (${reserva.roupa.ano})</strong> foi <strong>${novoEstado.toLowerCase()}</strong>.</p>
            <p><strong>Período:</strong> ${inicio} → ${fim}</p>
            <p><a href="${baseUrl}/perfil#sec-notificacoes">Ver no site</a></p>
          </div>
        `,
      });
    }
  }

  await logAdminAction(session, {
    action: "RESERVA_ESTADO_UPDATE",
    entityType: "RESERVA",
    entityId: reserva.id,
    description: `Alterou estado da reserva ${reserva.id} (${reserva.roupa.tema} ${reserva.roupa.ano}) para ${novoEstado}.`,
    metadata: {
      reservaId: reserva.id,
      novoEstado,
      roupaId: reserva.roupaId,
      roupaAno: reserva.roupa.ano,
      roupaTema: reserva.roupa.tema,
      dataInicio: reserva.dataInicio,
      dataFim: reserva.dataFim,
      adminNota: adminNota || null,
    },
  });

  return Response.json({ success: true, reserva });
}

