// Envia um e-mail de teste de verdade pelo Brevo.
// Uso: npm run email:test -- voce@exemplo.com   (só para esse endereço)
//      npm run email:test -- --aprovados       (para todos os moradores aprovados)
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailEnabled, sendEmail, siteUrl } from "@/lib/email";
import { profiles, user } from "@/db/schema";

const arg = process.argv[2];
if (!arg) throw new Error("Informe um e-mail ou --aprovados.");
if (!emailEnabled()) throw new Error("Preencha BREVO_API_KEY e EMAIL_FROM no .env.local.");

const recipients =
  arg === "--aprovados"
    ? await db
        .select({ email: user.email, name: profiles.name })
        .from(profiles)
        .innerJoin(user, eq(user.id, profiles.userId))
        .where(eq(profiles.status, "approved"))
    : [{ email: arg, name: arg }];

const link = siteUrl("/");
await sendEmail(recipients, {
  subject: "Teste: Fórum do Condomínio",
  html: `<p>Este é um e-mail de teste do Fórum do Condomínio.</p><p><a href="${link}">${link}</a></p>`,
  text: `Este é um e-mail de teste do Fórum do Condomínio.\n${link}`,
});
console.log(`Enviado para ${recipients.length} destinatário(s).`);
