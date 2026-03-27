import { Resend } from "resend";

type SendEmailArgs = {
  to: string[];
  subject: string;
  html: string;
  /** Se não enviar, gera-se texto a partir do HTML (melhora entregabilidade em alguns filtros, ex. webmail SAPO). */
  text?: string;
  replyTo?: string;
};

/** Versão texto para multipart/alternative — filtros anti-spam costumam valorizar HTML + texto coerentes. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<\/table>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Sem configuração de email: não falhar o fluxo principal.
    // Quando o domínio estiver verificado no Resend, defina RESEND_API_KEY e MAIL_FROM em .env
    return;
  }

  const from = process.env.MAIL_FROM || "Unidos de Avidos <no-reply@unidosdeavidos.pt>";
  const resend = new Resend(apiKey);
  const plain = (text ?? htmlToPlainText(html)).trim() || "(Sem conteúdo em texto.)";

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: plain,
    ...(replyTo ? { replyTo } : {}),
    headers: {
      // Ajuda alguns clientes a classificar como mensagem transacional (não mailing em massa).
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  });
}

