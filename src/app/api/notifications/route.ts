import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ items: [] }, { status: 200 });
  }

  const items = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });

  return Response.json({ items }, { status: 200 });
}

/** Apaga notificações do utilizador autenticado (por ids). */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawIds = body?.ids;
  const ids = Array.isArray(rawIds)
    ? rawIds.map((id: unknown) => (typeof id === "string" ? id : String(id))).filter(Boolean)
    : [];
  if (!ids.length) {
    return Response.json({ error: "Indique pelo menos um id." }, { status: 400 });
  }

  await prisma.notification.deleteMany({
    where: { userId: session.id, id: { in: ids } },
  });

  return Response.json({ success: true }, { status: 200 });
}

