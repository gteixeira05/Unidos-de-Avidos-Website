import { NextRequest } from "next/server";
import { getAdminTeamForReservaNotify } from "@/lib/admin-notify-recipients";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  if (!id) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== "cancelar") {
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      estado: true,
      roupa: { select: { tema: true, ano: true } },
    },
  });

  if (!reserva) {
    return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  if (!reserva.userId || reserva.userId !== session.id) {
    return Response.json({ error: "Sem permissões para gerir esta reserva." }, { status: 403 });
  }

  if (!["PENDENTE", "APROVADA"].includes(reserva.estado)) {
    return Response.json(
      { error: "Só pode cancelar reservas pendentes ou aprovadas." },
      { status: 409 }
    );
  }

  const updated = await prisma.reserva.update({
    where: { id },
    data: { estado: "CANCELADA" },
    select: { id: true, estado: true },
  });

  const admins = await getAdminTeamForReservaNotify();

  if (admins.length) {
    const who = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true },
    });
    const label = who?.name?.trim() || "Um utilizador";
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "RESERVA_CANCELADA",
        title: "Reserva cancelada pelo utilizador",
        body: `${label} cancelou a reserva de ${reserva.roupa.tema} (${reserva.roupa.ano}).`,
        href: "/admin/reservas",
      })),
    });
  }

  return Response.json({ success: true, reserva: updated });
}
