import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ items: [] });

  const items = await prisma.avaliacao.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      nota: true,
      comentario: true,
      aprovada: true,
      createdAt: true,
    },
  });

  return Response.json({ items });
}
