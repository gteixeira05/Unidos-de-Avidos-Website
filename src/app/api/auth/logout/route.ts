import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, getSessionFromRequest } from "@/lib/auth";
import { getSessionCookieOptions } from "@/lib/session-cookie";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Invalida o JWT no servidor (não só o cookie). ponytail: termina as sessões em todos os
  // dispositivos; para logout só deste dispositivo seria preciso uma lista de tokens revogados.
  const session = await getSessionFromRequest(req);
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { sessionVersion: true },
    });
    await prisma.user.update({
      where: { id: session.id },
      data: { sessionVersion: (user?.sessionVersion ?? 0) + 1 },
    });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", getSessionCookieOptions(0));
  return res;
}
