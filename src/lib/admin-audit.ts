import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

type LogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: unknown | null;
};

export async function logAdminAction(session: SessionUser, input: LogInput): Promise<void> {
  try {
    const metadata: Prisma.InputJsonValue | null =
      input.metadata === undefined || input.metadata === null
        ? null
        : (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue);

    await prisma.adminAuditLog.create({
      data: {
        actorUserId: session.id,
        actorEmail: session.email,
        actorName: session.name,
        actorRole: session.isSuperAdmin ? "SUPER_ADMIN" : session.role,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        description: input.description ?? null,
        metadata,
      },
    });
  } catch (error) {
    console.error("Falha ao guardar log de auditoria:", error);
  }
}

