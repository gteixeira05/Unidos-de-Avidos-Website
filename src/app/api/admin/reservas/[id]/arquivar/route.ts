import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { sendEmail } from "@/lib/email";

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
      nome: true,
      email: true,
      user: { select: { name: true, email: true } },
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

  if (arquivada) {
    const emailDestino = reserva.user?.email ?? reserva.email ?? null;
    const nomeDestino = reserva.user?.name ?? reserva.nome ?? null;
    if (emailDestino) {
      const baseUrl = process.env.APP_URL ?? "";
      const inicioFmt = new Date(reserva.dataInicio).toLocaleDateString("pt-PT");
      const fimFmt = new Date(reserva.dataFim).toLocaleDateString("pt-PT");
      await sendEmail({
        to: [emailDestino],
        subject: `A sua reserva foi concluída — ${reserva.roupa.tema} (${reserva.roupa.ano})`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2 style="margin:0 0 12px;color:#00923f">Reserva concluída</h2>
            <p>Olá${nomeDestino ? `, ${nomeDestino}` : ""},</p>
            <p>A sua reserva de <strong>${reserva.roupa.tema} (${reserva.roupa.ano})</strong> foi concluída e arquivada.</p>
            <p><strong>Período:</strong> ${inicioFmt} → ${fimFmt}</p>
            <p style="margin-top:20px">Esperamos que tenha gostado do nosso serviço. Seria uma honra receber a sua avaliação!</p>
            <p style="margin-top:16px">
              <a href="${baseUrl}/perfil#sec-avaliacoes" style="background:#00923f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
                Deixar avaliação
              </a>
            </p>
            <p style="margin-top:20px;font-size:13px;color:#6b7280">
              Se ainda não tem conta, pode criá-la gratuitamente em
              <a href="${baseUrl}/auth" style="color:#00923f">${baseUrl}/auth</a>.
            </p>
          </div>
        `,
      }).catch(() => {});
    }
  }

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
