import "server-only";

// Envio pela API de e-mail transacional do Brevo (sem SDK: um POST resolve).
// Sem BREVO_API_KEY (ex.: ambiente local) os envios são pulados.

export type Recipient = { email: string; name: string };
export type Email = { subject: string; html: string; text: string };

const API_URL = "https://api.brevo.com/v3/smtp/email";
// Limite do Brevo de versões por chamada; cada versão é um destinatário (ninguém vê o e-mail dos outros).
const BATCH = 1000;

export function emailEnabled() {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(recipients: Recipient[], email: Email) {
  if (!emailEnabled()) {
    console.warn(`[email] BREVO_API_KEY/EMAIL_FROM ausentes; não enviado: ${email.subject}`);
    return;
  }
  for (let i = 0; i < recipients.length; i += BATCH) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || "Fórum do Condomínio" },
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        messageVersions: recipients.slice(i, i + BATCH).map((r) => ({ to: [r] })),
      }),
    });
    if (!response.ok) {
      throw new Error(`Brevo respondeu ${response.status}: ${await response.text()}`);
    }
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Endereço público do site, para os links dos e-mails.
export function siteUrl(path: string) {
  return new URL(path, process.env.BETTER_AUTH_URL ?? "http://localhost:3000").toString();
}
