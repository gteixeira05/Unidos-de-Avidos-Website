import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ items: [] }, { status: 200 });
  }

  const items = await prisma.reserva.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      createdAt: true,
      pagamentoEstado: true,
      metodoPagamento: true,
      roupa: { select: { id: true, ano: true, tema: true, precoAluguer: true } },
    },
  });

  return Response.json({ items }, { status: 200 });
}

