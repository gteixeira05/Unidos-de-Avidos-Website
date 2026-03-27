import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Serviço de email não configurado. Configure RESEND_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { nome, email, mensagem } = body ?? {};

    if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) {
      return NextResponse.json(
        { error: "Nome, email e mensagem são obrigatórios." },
        { status: 400 }
      );
    }

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", emailNotifContacto: true },
      select: { email: true },
    });
    const emailsAdmins = admins.map((a) => a.email).filter(Boolean);
    if (!emailsAdmins.length) {
      return NextResponse.json(
        { error: "Não existem administradores com email configurado." },
        { status: 500 }
      );
    }

    await sendEmail({
      to: emailsAdmins,
      replyTo: email.trim(),
      subject: `Contacto do site: ${nome.trim()}`,
      html: `
        <p><strong>Novo contacto através do site Unidos de Avidos</strong></p>
        <p><strong>Nome:</strong> ${escapeHtml(nome.trim())}</p>
        <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(mensagem.trim()).replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return NextResponse.json(
      { error: "Erro ao processar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
