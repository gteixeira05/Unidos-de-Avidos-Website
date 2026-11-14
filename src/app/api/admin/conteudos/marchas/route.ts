import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { exigirAdmin, revalidarConteudos } from "@/lib/conteudos-admin";

export async function GET(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const items = await prisma.marchaAno.findMany({ orderBy: { ano: "desc" } });
  return Response.json({ items });
}

/** Acrescenta um ano (vazio); os detalhes editam-se em /[ano]. */
export async function POST(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const body = await req.json().catch(() => ({}));
  const ano = Number(body?.ano);
  if (!Number.isInteger(ano) || ano < 1990 || ano > 2100) {
    return Response.json({ error: "Ano inválido." }, { status: 400 });
  }
  if (await prisma.marchaAno.findUnique({ where: { ano } })) {
    return Response.json({ error: "Esse ano já existe." }, { status: 409 });
  }
  const marcha = await prisma.marchaAno.create({ data: { ano, classificacao: [], outros: [] } });
  await logAdminAction(s, { action: "MARCHA_CREATE", entityType: "MARCHA", entityId: marcha.id, description: `Acrescentou as Marchas ${ano}.` });
  revalidarConteudos();
  return Response.json({ marcha }, { status: 201 });
}
