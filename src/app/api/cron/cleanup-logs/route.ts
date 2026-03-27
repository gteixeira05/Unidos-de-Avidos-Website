import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_LOG_AGE_DAYS = 365; // 12 meses

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) {
    return Response.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Sem permissões." }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.adminAuditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return Response.json({
    success: true,
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}

