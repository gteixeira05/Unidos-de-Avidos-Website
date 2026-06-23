import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  getAdminTeamForReservaNotify,
  collectReservaNotifyEmails,
} from "@/lib/admin-notify-recipients";

export async function GET() {
  const items = await prisma.avaliacao.findMany({
    where: { aprovada: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      nota: true,
      comentario: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ error: "Tem de iniciar sessão para deixar uma avaliação." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nota = Number(body?.nota);
  const comentario = (body?.comentario ?? "").toString().trim() || null;

  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return Response.json({ error: "A nota deve ser entre 1 e 5 estrelas." }, { status: 400 });
  }
  if (comentario && comentario.length > 600) {
    return Response.json({ error: "O comentário não pode ter mais de 600 caracteres." }, { status: 400 });
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      userId: session.id,
      nota,
      comentario,
    },
    select: {
      id: true,
      nota: true,
      comentario: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Notify admins
  try {
    const team = await getAdminTeamForReservaNotify();

    await Promise.all(
      team.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: "NOVA_AVALIACAO",
            title: "Nova avaliação por aprovar",
            body: `${avaliacao.user.name} deixou uma avaliação de ${nota} estrela${nota !== 1 ? "s" : ""}${comentario ? `: "${comentario.slice(0, 80)}${comentario.length > 80 ? "…" : ""}"` : ""}.`,
            href: "/admin?tab=avaliacoes",
          },
        })
      )
    );

    const emailDestinos = collectReservaNotifyEmails(team);
    if (emailDestinos.length > 0) {
      const baseUrl = process.env.APP_URL ?? "";
      await sendEmail({
        to: emailDestinos,
        subject: `Nova avaliação por aprovar — ${nota} estrela${nota !== 1 ? "s" : ""}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2 style="margin:0 0 12px;color:#00923f">Nova avaliação por aprovar</h2>
            <p><strong>${avaliacao.user.name}</strong> deixou uma nova avaliação:</p>
            <p style="font-size:22px;margin:8px 0">
              ${"★".repeat(nota)}${"☆".repeat(5 - nota)}
              <span style="font-size:14px;color:#6b7280"> (${nota}/5)</span>
            </p>
            ${comentario ? `<p style="background:#f9fafb;border-left:4px solid #00923f;padding:10px 14px;border-radius:4px">"${comentario}"</p>` : ""}
            <p style="margin-top:20px">
              <a href="${baseUrl}/admin?tab=avaliacoes" style="background:#00923f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
                Ver no painel admin
              </a>
            </p>
          </div>
        `,
      });
    }
  } catch {
    // Notificações não bloqueiam a resposta
  }

  return Response.json({ success: true, avaliacao }, { status: 201 });
}
