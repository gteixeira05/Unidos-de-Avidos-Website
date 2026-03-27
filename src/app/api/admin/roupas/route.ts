import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const items = await prisma.roupa.findMany({
    orderBy: { ano: "desc" },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const ano = Number(body?.ano);
  const tema = (body?.tema ?? "").toString().trim();
  const precoAluguer = Number(body?.precoAluguer);

  if (!Number.isFinite(ano) || !tema || !Number.isFinite(precoAluguer)) {
    return Response.json({ error: "Campos inválidos (ano, tema, precoAluguer)." }, { status: 400 });
  }

  const qh = Number(body?.quantidadeHomem);
  const qm = Number(body?.quantidadeMulher);
  const quantidadeHomem = Number.isFinite(qh) ? Math.max(0, Math.floor(qh)) : 0;
  const quantidadeMulher = Number.isFinite(qm) ? Math.max(0, Math.floor(qm)) : 0;

  const roupa = await prisma.roupa.create({
    data: {
      ano,
      tema,
      descricao: body?.descricao?.toString() ?? null,
      imagemUrl: body?.imagemUrl?.toString() ?? null,
      quantidadeHomem,
      quantidadeMulher,
      conjuntoInclui: body?.conjuntoInclui?.toString() ?? null,
      regrasLavagem: body?.regrasLavagem?.toString() ?? null,
      precoAluguer,
    },
  });

  await logAdminAction(session, {
    action: "ROUPA_CREATE",
    entityType: "ROUPA",
    entityId: roupa.id,
    description: `Criou roupa ${roupa.tema} (${roupa.ano}).`,
    metadata: {
      roupaId: roupa.id,
      ano: roupa.ano,
      tema: roupa.tema,
      precoAluguer: roupa.precoAluguer,
      quantidadeHomem: roupa.quantidadeHomem,
      quantidadeMulher: roupa.quantidadeMulher,
    },
  });

  return Response.json({ success: true, roupa }, { status: 201 });
}

