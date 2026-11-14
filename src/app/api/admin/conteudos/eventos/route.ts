import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { diaValido, exigirAdmin, revalidarConteudos, texto } from "@/lib/conteudos-admin";

export async function GET(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const items = await prisma.evento.findMany({ orderBy: { data: "desc" } });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const body = await req.json().catch(() => ({}));
  const titulo = texto(body?.titulo, 120);
  const data = diaValido(body?.data);
  if (!titulo || !data) return Response.json({ error: "Indique o título e a data." }, { status: 400 });

  const evento = await prisma.evento.create({
    data: { titulo, data, descricao: texto(body?.descricao, 1000), imagemUrl: texto(body?.imagemUrl, 1000) },
  });
  await logAdminAction(s, {
    action: "EVENTO_CREATE",
    entityType: "EVENTO",
    entityId: evento.id,
    description: `Criou o evento ${titulo} (${body.data}).`,
  });
  revalidarConteudos();
  return Response.json({ evento }, { status: 201 });
}
