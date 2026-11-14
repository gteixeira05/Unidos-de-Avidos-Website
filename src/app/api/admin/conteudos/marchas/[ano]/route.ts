import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { exigirAdmin, revalidarConteudos, texto } from "@/lib/conteudos-admin";

function lista<T>(v: unknown, max: number, map: (x: Record<string, unknown>) => T | null): T[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > max) return null;
  const out: T[] = [];
  for (const x of v) {
    const m = map((x ?? {}) as Record<string, unknown>);
    if (m) out.push(m);
  }
  return out;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ ano: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const marcha = await prisma.marchaAno.findUnique({ where: { ano: Number((await params).ano) } });
  if (!marcha) return Response.json({ error: "Ano não encontrado." }, { status: 404 });
  return Response.json({ marcha });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ ano: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const ano = Number((await params).ano);
  const body = await req.json().catch(() => ({}));

  const youtubeUrl = texto(body?.youtubeUrl, 300);
  if (youtubeUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(youtubeUrl)) {
    return Response.json({ error: "O vídeo tem de ser um link do YouTube (https://…)." }, { status: 400 });
  }
  // Linhas sem nome (classificação) ou sem título (blocos) são ignoradas.
  const classificacao = lista(body?.classificacao, 60, (c) => {
    const nome = texto(c.nome, 200);
    if (!nome) return null;
    return {
      pos: texto(c.pos, 10) ?? "",
      nome,
      ...(texto(c.pontos, 40) ? { pontos: texto(c.pontos, 40)! } : {}),
      ...(texto(c.premios, 200) ? { premios: texto(c.premios, 200)! } : {}),
    };
  });
  const outros = lista(body?.outros, 20, (b) => {
    const titulo = texto(b.titulo, 120);
    const textoBloco = texto(b.texto, 5000);
    return titulo && textoBloco ? { titulo, texto: textoBloco } : null;
  });
  if (!classificacao || !outros) return Response.json({ error: "Dados inválidos." }, { status: 400 });

  const marcha = await prisma.marchaAno
    .update({
      where: { ano },
      data: {
        tema: texto(body?.tema, 300),
        descricaoCard: texto(body?.descricaoCard, 2000),
        subtitulo: texto(body?.subtitulo, 120),
        mensagem: texto(body?.mensagem, 5000),
        youtubeUrl,
        classificacao: classificacao as Prisma.InputJsonValue,
        outros: outros as Prisma.InputJsonValue,
      },
    })
    .catch(() => null);
  if (!marcha) return Response.json({ error: "Ano não encontrado." }, { status: 404 });
  await logAdminAction(s, { action: "MARCHA_UPDATE", entityType: "MARCHA", entityId: marcha.id, description: `Editou as Marchas ${ano}.` });
  revalidarConteudos();
  return Response.json({ marcha });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ano: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const ano = Number((await params).ano);
  const marcha = await prisma.marchaAno.delete({ where: { ano } }).catch(() => null);
  if (!marcha) return Response.json({ error: "Ano não encontrado." }, { status: 404 });
  await logAdminAction(s, { action: "MARCHA_DELETE", entityType: "MARCHA", entityId: marcha.id, description: `Apagou as Marchas ${ano}.` });
  revalidarConteudos();
  return Response.json({ success: true });
}
