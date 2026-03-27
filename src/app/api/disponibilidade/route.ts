import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roupaId = searchParams.get("roupaId");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  if (!roupaId || !inicio || !fim) {
    return Response.json(
      { error: "Parâmetros roupaId, inicio e fim são obrigatórios" },
      { status: 400 }
    );
  }

  const disponibilidades = await prisma.disponibilidade.findMany({
    where: {
      roupaId,
      data: {
        gte: new Date(inicio),
        lte: new Date(fim),
      },
    },
  });

  return Response.json(
    disponibilidades.map((d) => ({
      data: d.data.toISOString(),
      estado: d.estado,
    }))
  );
}
