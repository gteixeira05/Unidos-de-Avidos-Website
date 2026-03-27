import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ success: false }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? (body.ids as string[]) : null;

  // MongoDB: campo opcional ausente ≠ null; `readAt: null` não apanha “unset”.
  const unreadClause = {
    OR: [{ readAt: null }, { readAt: { isSet: false } }],
  };

  const where =
    ids?.length && ids.length > 0
      ? { userId: session.id, id: { in: ids } }
      : { userId: session.id, ...unreadClause };

  await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return Response.json({ success: true });
}

