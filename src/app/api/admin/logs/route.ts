import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!session.isSuperAdmin) return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const action = (url.searchParams.get("action") ?? "").trim();
  const entityType = (url.searchParams.get("entityType") ?? "").trim();
  const actorUserId = (url.searchParams.get("actorUserId") ?? "").trim();
  const cursor = (url.searchParams.get("cursor") ?? "").trim();
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? "50");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.max(10, Math.min(100, Math.floor(pageSizeRaw)))
    : 50;

  /** MongoDB: combinar filtros com AND explícito; `mode: insensitive` não é suportado em strings. */
  const conditions: Prisma.AdminAuditLogWhereInput[] = [];
  if (action) conditions.push({ action });
  if (entityType) conditions.push({ entityType });
  if (actorUserId) conditions.push({ actorUserId });
  if (q) {
    conditions.push({
      OR: [
        { actorName: { contains: q } },
        { actorEmail: { contains: q } },
        { description: { contains: q } },
        { action: { contains: q } },
        { entityType: { contains: q } },
      ],
    });
  }
  const where: Prisma.AdminAuditLogWhereInput =
    conditions.length === 0 ? {} : { AND: conditions };

  const [items, actions, entityTypes, actors] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.adminAuditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.adminAuditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
    prisma.adminAuditLog.findMany({
      distinct: ["actorUserId"],
      where: { actorUserId: { not: null } },
      select: { actorUserId: true, actorName: true, actorEmail: true },
      orderBy: { actorName: "asc" },
    }),
  ]);

  const pageItems = items.slice(0, pageSize);
  const nextCursor = items.length > pageSize ? pageItems[pageItems.length - 1]?.id : null;

  return Response.json({
    items: pageItems,
    nextCursor,
    filters: {
      actions: actions.map((a) => a.action),
      entityTypes: entityTypes.map((e) => e.entityType),
      actors: actors
        .filter((a): a is { actorUserId: string; actorName: string; actorEmail: string } =>
          Boolean(a.actorUserId)
        )
        .map((a) => ({
          actorUserId: a.actorUserId,
          label: `${a.actorName} (${a.actorEmail})`,
        })),
    },
  });
}

