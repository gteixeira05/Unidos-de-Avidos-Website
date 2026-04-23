import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADO_PRECEDENCIA: Record<string, number> = {
  MANUTENCAO: 3,
  ALUGADA: 2,
  LIVRE: 1,
};

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

  // Várias linhas com o mesmo dia civil (só a hora em `data` muda) podem ocorrer; a UI
  // mapeia por "YYYY-MM-DD" e a última ganhava, escondendo ALUGADA. Preferir o estado mais “forte”.
  const porDiaCivil = new Map<
    string,
    (typeof disponibilidades)[0]
  >();
  for (const d of disponibilidades) {
    const key = d.data.toISOString().split("T")[0] ?? "";
    const p = ESTADO_PRECEDENCIA[d.estado] ?? 0;
    const ex = porDiaCivil.get(key);
    const pEx = ex ? ESTADO_PRECEDENCIA[ex.estado] ?? 0 : -1;
    if (!ex || p > pEx) porDiaCivil.set(key, d);
  }

  return Response.json(
    Array.from(porDiaCivil.values()).map((d) => ({
      data: d.data.toISOString(),
      estado: d.estado,
    }))
  );
}
