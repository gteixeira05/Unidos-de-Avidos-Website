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

  /**
   * Quando o cliente envia YYYY-MM-DD, usa o intervalo [início, fim] em calendário civil UTC:
   * [start T00, próximoDiaFim) para incluir tudo o que cai nesse mês, mesmo com hora ≠ 00:00.
   */
  function rangoCivilAUTC(ini: string, fim: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(ini) && /^\d{4}-\d{2}-\d{2}$/.test(fim)) {
      const gte = new Date(`${ini}T00:00:00.000Z`);
      const ultima = new Date(`${fim}T00:00:00.000Z`);
      if (Number.isNaN(gte.getTime()) || Number.isNaN(ultima.getTime())) return null;
      if (gte > ultima) return null;
      const limiteFim = new Date(ultima);
      limiteFim.setUTCDate(limiteFim.getUTCDate() + 1);
      return { gte, lt: limiteFim } as const;
    }
    const gte = new Date(ini);
    const lte = new Date(fim);
    if (Number.isNaN(gte.getTime()) || Number.isNaN(lte.getTime())) return null;
    if (gte > lte) return null;
    return { gte, lte } as const;
  }

  const rango = rangoCivilAUTC(inicio, fim);
  if (!rango) {
    return Response.json(
      { error: "Parâmetros inicio e fim inválidos" },
      { status: 400 }
    );
  }

  const dataWhere =
    "lt" in rango ? { gte: rango.gte, lt: rango.lt } : { gte: rango.gte, lte: rango.lte };

  const disponibilidades = await prisma.disponibilidade.findMany({
    where: { roupaId, data: dataWhere },
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
