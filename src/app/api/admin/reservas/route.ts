import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

const RESERVA_ESTADOS = ["PENDENTE", "APROVADA", "REJEITADA"] as const;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const estado = url.searchParams.get("estado");
  const roupaId = url.searchParams.get("roupaId");

  const where: Prisma.ReservaWhereInput = {};
  if (estado && (RESERVA_ESTADOS as readonly string[]).includes(estado)) {
    where.estado = estado;
  }
  if (roupaId) where.roupaId = roupaId;

  const items = await prisma.reserva.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      nome: true,
      email: true,
      telefone: true,
      observacoes: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      roupa: { select: { id: true, ano: true, tema: true, precoAluguer: true } },
    },
  });

  return Response.json({ items });
}

