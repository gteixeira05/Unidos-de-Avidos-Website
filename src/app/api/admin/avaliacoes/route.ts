import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const aprovadaParam = url.searchParams.get("aprovada");

  const where: { aprovada?: boolean } = {};
  if (aprovadaParam === "true") where.aprovada = true;
  else if (aprovadaParam === "false") where.aprovada = false;

  const items = await prisma.avaliacao.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      nota: true,
      comentario: true,
      aprovada: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ items });
}
