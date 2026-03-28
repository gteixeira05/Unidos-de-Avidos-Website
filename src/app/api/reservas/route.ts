import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  collectReservaNotifyEmails,
  getAdminTeamForReservaNotify,
} from "@/lib/admin-notify-recipients";
import { consumeRateLimit, escapeHtml, getClientIp, normalizeEmail } from "@/lib/security";
import { PRECO_ALUGUER_PUBLICO } from "@/lib/aluguerRoupasPublic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = consumeRateLimit({
      key: `reserva:create:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return Response.json(
        { error: "Demasiados pedidos de reserva. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const {
      roupaId,
      dataInicio,
      dataFim,
      observacoes,
      nome,
      email,
      telefone,
    } = body;

    if (!roupaId || !dataInicio || !dataFim) {
      return Response.json(
        { error: "roupaId, dataInicio e dataFim são obrigatórios" },
        { status: 400 }
      );
    }

    const telefoneLimpo = (telefone ?? "").toString().trim();
    if (!telefoneLimpo) {
      return Response.json({ error: "O telefone é obrigatório." }, { status: 400 });
    }

    const emailLimpo = email == null ? null : normalizeEmail(email);
    if (email != null && !emailLimpo) {
      return Response.json({ error: "Email inválido." }, { status: 400 });
    }

    const roupa = await prisma.roupa.findUnique({
      where: { id: roupaId },
    });

    if (!roupa) {
      return Response.json({ error: "Roupa não encontrada" }, { status: 404 });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio > fim) {
      return Response.json({ error: "Intervalo de datas inválido." }, { status: 400 });
    }

    const [ocupacaoCalendario, reservaSobreposta] = await Promise.all([
      prisma.disponibilidade.findFirst({
        where: {
          roupaId,
          estado: { in: ["ALUGADA", "MANUTENCAO"] },
          data: { gte: inicio, lte: fim },
        },
        select: { id: true },
      }),
      prisma.reserva.findFirst({
        where: {
          roupaId,
          estado: { in: ["PENDENTE", "APROVADA"] },
          dataInicio: { lte: fim },
          dataFim: { gte: inicio },
        },
        select: { id: true },
      }),
    ]);

    if (ocupacaoCalendario || reservaSobreposta) {
      return Response.json(
        { error: "As datas selecionadas já estão ocupadas. Escolha outro intervalo." },
        { status: 409 }
      );
    }

    const reserva = await prisma.reserva.create({
      data: {
        roupaId,
        userId: session.id,
        dataInicio: inicio,
        dataFim: fim,
        quantidadeHomem: 0,
        quantidadeMulher: 0,
        observacoes: observacoes || null,
        nome: typeof nome === "string" ? nome.trim().slice(0, 120) || null : null,
        email: emailLimpo,
        telefone: telefoneLimpo,
      },
    });

    // Notificar equipa de backoffice (ADMIN na BD + Super Admin por email, mesmo como USER)
    const [admins, user] = await Promise.all([
      getAdminTeamForReservaNotify(),
      prisma.user.findUnique({
        where: { id: session.id },
        select: { id: true, name: true, email: true },
      }),
    ]);

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "RESERVA_CRIADA",
          title: "Novo pedido de reserva",
          body: `${user?.name ?? "Um utilizador"} pediu reserva da roupa ${roupa.tema} (${roupa.ano}).`,
          href: "/admin/reservas",
        })),
      });

      const emails = collectReservaNotifyEmails(admins);
      if (emails.length) {
        const inicio = new Date(dataInicio).toLocaleDateString("pt-PT");
        const fim = new Date(dataFim).toLocaleDateString("pt-PT");
        const userSafeName = escapeHtml(user?.name ?? "-");
        const userSafeEmail = escapeHtml(user?.email ?? "-");
        const roupaTemaSafe = escapeHtml(String(roupa.tema));
        await sendEmail({
          to: emails,
          subject: `Novo pedido de reserva — ${roupa.tema} (${roupa.ano})`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.4">
              <h2>Novo pedido de reserva</h2>
              <p><strong>Utilizador:</strong> ${userSafeName} (${userSafeEmail})</p>
              <p><strong>Roupa:</strong> ${roupaTemaSafe} (${roupa.ano})</p>
              <p><strong>Período:</strong> ${inicio} → ${fim}</p>
              <p><strong>Preço total:</strong> ${escapeHtml(PRECO_ALUGUER_PUBLICO)} (a acordar)</p>
              <p><a href="${process.env.APP_URL ?? ""}/admin/reservas">Abrir painel de reservas</a></p>
            </div>
          `,
        });
      }
    }

    return Response.json({ success: true, id: reserva.id });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return Response.json(
      { error: "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}
