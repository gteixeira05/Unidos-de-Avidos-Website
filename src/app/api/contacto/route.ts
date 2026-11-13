import { NextRequest, NextResponse } from "next/server";
import { getContactFormAdminEmails } from "@/lib/admin-notify-recipients";
import { sendEmail } from "@/lib/email";
import { consumeRateLimitDb, escapeHtml, getClientIp, normalizeEmail } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Serviço de email não configurado. Configure RESEND_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const limit = await consumeRateLimitDb({
      key: `contacto:ip:${getClientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Demasiadas mensagens. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email = normalizeEmail(body?.email);
    const mensagem = typeof body?.mensagem === "string" ? body.mensagem.trim() : "";

    if (!nome || !email || !mensagem) {
      return NextResponse.json(
        { error: "Nome, email e mensagem são obrigatórios." },
        { status: 400 }
      );
    }
    if (nome.length > 120 || mensagem.length > 5000) {
      return NextResponse.json(
        { error: "Nome ou mensagem demasiado longos." },
        { status: 400 }
      );
    }

    const emailsAdmins = await getContactFormAdminEmails();
    if (!emailsAdmins.length) {
      return NextResponse.json(
        { error: "Não existem destinatários configurados para contactos do site." },
        { status: 500 }
      );
    }

    await sendEmail({
      to: emailsAdmins,
      replyTo: email,
      subject: `Contacto do site: ${nome.replace(/[\r\n]+/g, " ")}`,
      html: `
        <p><strong>Novo contacto através do site Unidos de Avidos</strong></p>
        <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
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

