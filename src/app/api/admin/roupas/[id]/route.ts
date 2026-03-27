import { rm } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { removeStoredMediaAsset } from "@/lib/media/remove-stored-asset";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const roupa = await prisma.roupa.findUnique({ where: { id } });
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });
  return Response.json({ roupa });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const before = await prisma.roupa.findUnique({
    where: { id },
    select: {
      id: true,
      ano: true,
      tema: true,
      descricao: true,
      imagemUrl: true,
      conjuntoInclui: true,
      regrasLavagem: true,
      precoAluguer: true,
      quantidadeHomem: true,
      quantidadeMulher: true,
    },
  });
  if (!before) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });

  function parseNonNegInt(v: unknown): number | undefined {
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0, Math.floor(n));
  }

  const patch = {
    ano: body?.ano !== undefined ? Number(body.ano) : undefined,
    descricao: body?.descricao !== undefined ? (body.descricao?.toString() ?? null) : undefined,
    imagemUrl: body?.imagemUrl !== undefined ? (body.imagemUrl?.toString() ?? null) : undefined,
    conjuntoInclui:
      body?.conjuntoInclui !== undefined ? (body.conjuntoInclui?.toString() ?? null) : undefined,
    regrasLavagem:
      body?.regrasLavagem !== undefined ? (body.regrasLavagem?.toString() ?? null) : undefined,
    precoAluguer: body?.precoAluguer !== undefined ? Number(body.precoAluguer) : undefined,
    quantidadeHomem: parseNonNegInt(body?.quantidadeHomem),
    quantidadeMulher: parseNonNegInt(body?.quantidadeMulher),
  };

  const roupa = await prisma.roupa.update({
    where: { id },
    data: patch,
  });

  const changes: { field: string; from: unknown; to: unknown }[] = [];
  for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
    const next = patch[key];
    if (next === undefined) continue; // não foi enviado
    const prev = before[key as keyof typeof before];
    // Comparação simples (inclui null vs string/number)
    if (Object.is(prev, next)) continue;
    changes.push({ field: String(key), from: prev, to: next });
  }

  const changesSummary =
    changes.length > 0
      ? ` Alterações: ${changes
          .slice(0, 6)
          .map((c) => `${c.field}: ${String(c.from)} → ${String(c.to)}`)
          .join(", ")}${changes.length > 6 ? ` (+${changes.length - 6})` : ""}.`
      : "";

  await logAdminAction(session, {
    action: "ROUPA_UPDATE",
    entityType: "ROUPA",
    entityId: roupa.id,
    description: `Editou roupa ${before.tema} (${before.ano}).${changesSummary}`,
    metadata: { roupaId: roupa.id, ano: before.ano, tema: before.tema, changes },
  });

  return Response.json({ success: true, roupa });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id } = await params;
  const roupa = await prisma.roupa.findUnique({
    where: { id },
    select: {
      id: true,
      ano: true,
      tema: true,
      imagemUrl: true,
      photos: { select: { imageUrl: true } },
    },
  });
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });

  await prisma.roupa.delete({ where: { id } });

  const urls = new Set<string>();
  if (roupa.imagemUrl) urls.add(roupa.imagemUrl);
  for (const p of roupa.photos) urls.add(p.imageUrl);
  await Promise.all([...urls].map((u) => removeStoredMediaAsset(u)));

  const dir = path.join(process.cwd(), "public", "roupas", id);
  await rm(dir, { recursive: true, force: true }).catch(() => {});

  await logAdminAction(session, {
    action: "ROUPA_DELETE",
    entityType: "ROUPA",
    entityId: id,
    description: `Eliminou a roupa ${roupa.tema} (${roupa.ano}).`,
    metadata: { roupaId: id, ano: roupa.ano, tema: roupa.tema },
  });

  return Response.json({ success: true });
}

