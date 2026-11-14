import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/** RGPD — o utilizador descarrega todos os seus dados em JSON. */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const [conta, reservas, avaliacoes, notificacoes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
        emailNotifContacto: true,
        emailNotifReservas: true,
        emailComunicacoesConsent: true,
        emailComunicacoesConsentAt: true,
        emailComunicacoesConsentVersion: true,
        emailComunicacoesRevokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.reserva.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        roupa: { select: { tema: true, ano: true } },
        dataInicio: true,
        dataFim: true,
        estado: true,
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
        createdAt: true,
      },
    }),
    prisma.avaliacao.findMany({
      where: { userId: session.id },
      select: { nota: true, comentario: true, aprovada: true, createdAt: true },
    }),
    prisma.notification.findMany({
      where: { userId: session.id },
      select: { title: true, body: true, readAt: true, createdAt: true },
    }),
  ]);

  const dados = {
    exportadoEm: new Date().toISOString(),
    origem: "Associação Unidos de Avidos — unidosdeavidos.pt",
    conta,
    reservas,
    avaliacoes,
    notificacoes,
  };

  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="os-meus-dados-unidos-de-avidos.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
