import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/conteudos-admin";

/** Contadores para o menu do admin. */
export async function GET(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const [reservasPendentes, avaliacoesPendentes, caucoesPorDevolver] = await Promise.all([
    prisma.reserva.count({ where: { estado: "PENDENTE" } }),
    prisma.avaliacao.count({ where: { aprovada: false } }),
    prisma.reserva.count({ where: { caucaoPaga: true, caucaoDevolvida: false } }),
  ]);
  return Response.json(
    { reservasPendentes, avaliacoesPendentes, caucoesPorDevolver },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
