import "server-only";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { CHOICES } from "@/lib/choices";
import { authorLabel, countUnits, getDebate, isOpen } from "@/lib/debates";
import { emailEnabled, escapeHtml, sendEmail, siteUrl, type Email } from "@/lib/email";
import { getResults } from "@/lib/votes";
import { debates, profiles, user } from "@/db/schema";

// Avisos por e-mail a todos os moradores aprovados (PRD item 8).

// Encerramentos mais antigos que isso não geram e-mail (evita disparar avisos de debates velhos,
// ex.: na primeira execução ou depois de um tempo sem chave do Brevo). O cron roda 1x por dia.
const CLOSE_WINDOW = sql`interval '3 days'`;

async function approvedRecipients(exceptUserId?: string | null) {
  return db
    .select({ email: user.email, name: profiles.name })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(and(eq(profiles.status, "approved"), exceptUserId ? ne(profiles.userId, exceptUserId) : undefined));
}

function layout(title: string, paragraphs: string[], link: string): Email["html"] {
  return `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#111;max-width:560px">
<h2 style="font-size:20px">${escapeHtml(title)}</h2>
${paragraphs.map((p) => `<p>${p}</p>`).join("\n")}
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Abrir no fórum</a></p>
<p style="font-size:13px;color:#666">Você recebe este aviso por ser morador aprovado no Fórum do Condomínio.</p>
</div>`;
}

// Debate novo: avisa todos menos o autor.
export async function notifyNewDebate(debateId: string) {
  const debate = await getDebate(debateId);
  if (!debate) return;
  const link = siteUrl(`/debates/${debate.id}`);
  const author = authorLabel(debate);
  const excerpt = debate.body.length > 300 ? `${debate.body.slice(0, 300)}…` : debate.body;

  await sendEmail(await approvedRecipients(debate.authorId), {
    subject: `Novo debate: ${debate.title}`,
    html: layout(
      debate.title,
      [`Aberto por ${escapeHtml(author)}.`, escapeHtml(excerpt).replaceAll("\n", "<br>"), "Participe e vote pelo seu apartamento."],
      link,
    ),
    text: `Novo debate: ${debate.title}\nAberto por ${author}.\n\n${excerpt}\n\nParticipe e vote pelo seu apartamento: ${link}`,
  });
}

// Envia o resultado de todo debate encerrado (pelo admin ou por prazo vencido) que ainda não foi avisado.
// Chamado ao encerrar, pelo cron e ao abrir as páginas. Cada debate é "reservado" num único UPDATE,
// então chamadas simultâneas não mandam o mesmo aviso duas vezes.
export async function notifyClosedDebates() {
  if (!emailEnabled()) return;

  const claimed = await db
    .update(debates)
    .set({ closeNotifiedAt: sql`now()` })
    .where(
      and(
        isNull(debates.closeNotifiedAt),
        sql`not ${isOpen}`,
        sql`coalesce(${debates.closedAt}, ${debates.deadline}) > now() - ${CLOSE_WINDOW}`,
      ),
    )
    .returning({ id: debates.id, title: debates.title });
  if (claimed.length === 0) return;

  const [recipients, unitCount] = await Promise.all([approvedRecipients(), countUnits()]);
  for (const debate of claimed) {
    try {
      await sendEmail(recipients, closedEmail(debate, await getResults(debate.id), unitCount));
    } catch (error) {
      // Libera para a próxima tentativa.
      await db.update(debates).set({ closeNotifiedAt: null }).where(eq(debates.id, debate.id));
      console.error(`[email] falha no aviso de encerramento de ${debate.id}`, error);
    }
  }
}

function closedEmail(
  debate: { id: string; title: string },
  results: Awaited<ReturnType<typeof getResults>>,
  unitCount: number,
): Email {
  const link = siteUrl(`/debates/${debate.id}`);
  const lines = CHOICES.map(({ value, label }) => {
    const count = results[value];
    const percent = results.total ? Math.round((count / results.total) * 100) : 0;
    return `${label}: ${count} (${percent}%)`;
  });
  const turnout = `${results.total} de ${unitCount} apartamentos votaram.`;

  return {
    subject: `Debate encerrado: ${debate.title}`,
    html: layout(debate.title, ["O debate foi encerrado. Resultado final:", lines.map(escapeHtml).join("<br>"), turnout], link),
    text: `Debate encerrado: ${debate.title}\n\nResultado final:\n${lines.join("\n")}\n${turnout}\n\n${link}`,
  };
}
