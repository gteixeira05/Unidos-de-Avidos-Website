import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { ORGAOS_SOCIAIS } from "@/lib/conteudos";
import { exigirAdmin, revalidarConteudos, texto } from "@/lib/conteudos-admin";

export async function GET(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const items = await prisma.orgaoSocialMembro.findMany({ orderBy: [{ orgao: "asc" }, { ordem: "asc" }] });
  return Response.json({ items });
}

/** Substitui a lista completa (o admin edita tudo de uma vez). */
export async function PUT(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const body = await req.json().catch(() => ({}));
  const validos = new Set<string>(ORGAOS_SOCIAIS.map((o) => o.id));
  const lista = Array.isArray(body?.items) ? body.items : null;
  if (!lista || lista.length > 100) return Response.json({ error: "Lista inválida." }, { status: 400 });

  const data = [];
  for (const [i, m] of lista.entries()) {
    const cargo = texto(m?.cargo, 80);
    const nome = texto(m?.nome, 200);
    if (!validos.has(m?.orgao) || !cargo || !nome) {
      return Response.json({ error: `Linha ${i + 1}: preencha o órgão, o cargo e o nome.` }, { status: 400 });
    }
    data.push({ orgao: m.orgao as string, cargo, nome, ordem: i });
  }

  await prisma.$transaction([prisma.orgaoSocialMembro.deleteMany({}), prisma.orgaoSocialMembro.createMany({ data })]);
  await logAdminAction(s, {
    action: "ORGAOS_UPDATE",
    entityType: "ORGAOS_SOCIAIS",
    description: `Atualizou os órgãos sociais (${data.length} membros).`,
  });
  revalidarConteudos();
  return Response.json({ success: true });
}
