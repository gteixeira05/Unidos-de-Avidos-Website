import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ count: 0 }, { status: 200 });
  }

  const count = await prisma.notification.count({
    where: {
      userId: session.id,
      OR: [{ readAt: null }, { readAt: { isSet: false } }],
    },
  });

  return Response.json({ count }, { status: 200 });
}

