// Teste das regras de aviso por e-mail contra o banco real, sem enviar nada (fetch é interceptado).
// Cria dados `test-` e apaga no fim. Uso: npm run db:test-emails
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { debates, profiles, units, user } from "@/db/schema";

process.env.BREVO_API_KEY = "test";
process.env.EMAIL_FROM = "forum@example.test";
const { notifyClosedDebates, notifyNewDebate } = await import("@/lib/notifications");

type Sent = { subject: string; to: string[] };
const sent: Sent[] = [];
let failNext = false;
// Só intercepta o Brevo; o driver do Neon também usa fetch.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  if (!String(url).includes("api.brevo.com")) return realFetch(url, init);
  const body = JSON.parse(String(init!.body));
  if (failNext) {
    failNext = false;
    return new Response("erro simulado", { status: 500 });
  }
  sent.push({ subject: body.subject, to: body.messageVersions.map((v: { to: { email: string }[] }) => v.to[0].email) });
  return new Response("{}", { status: 201 });
}) as typeof fetch;

const stamp = Date.now();
const ids = { approved: `test-${stamp}-1`, pending: `test-${stamp}-2` };
const emailOf = (id: string) => `${id}@example.test`;

const [unit] = await db.select({ id: units.id }).from(units).where(and(eq(units.block, "A"), eq(units.number, 11)));
if (!unit) throw new Error("Rode `npm run db:seed` antes.");

let failed = false;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "OK  " : "FALHOU"} ${label}`);
  if (!ok) failed = true;
}
const sentFor = (title: string) => sent.filter((s) => s.subject.includes(title));

// Debates reais ainda sem aviso: o teste pode "reservá-los"; no fim voltam como estavam.
const pendingReal = (
  await db.select({ id: debates.id }).from(debates).where(isNull(debates.closeNotifiedAt))
).map((d) => d.id);

const debateIds: string[] = [];
try {
  await db.insert(user).values(Object.values(ids).map((id) => ({ id, name: id, email: emailOf(id) })));
  await db.insert(profiles).values([
    { userId: ids.approved, unitId: unit.id, name: "Teste aprovado", status: "approved" },
    { userId: ids.pending, unitId: unit.id, name: "Teste pendente", status: "pending" },
  ]);

  const title = `test-${stamp}`;
  const created = await db
    .insert(debates)
    .values([
      { title: `${title} novo`, body: "corpo <b>", authorId: ids.approved },
      { title: `${title} encerrado`, body: "x", authorId: ids.approved, closedAt: sql`now()` },
      { title: `${title} prazo`, body: "x", authorId: ids.approved, deadline: sql`now() - interval '1 hour'` },
      { title: `${title} velho`, body: "x", authorId: ids.approved, closedAt: sql`now() - interval '10 days'` },
      { title: `${title} aberto`, body: "x", authorId: ids.approved, deadline: sql`now() + interval '1 day'` },
    ])
    .returning({ id: debates.id });
  debateIds.push(...created.map((d) => d.id));

  await notifyNewDebate(created[0].id);
  const novo = sentFor(`${title} novo`);
  check("debate novo: um envio", novo.length === 1);
  check("debate novo: autor não recebe", !novo[0]?.to.includes(emailOf(ids.approved)));
  check("debate novo: pendente não recebe", !novo[0]?.to.includes(emailOf(ids.pending)));

  // Duas chamadas ao mesmo tempo (ex.: admin encerra enquanto o cron roda).
  await Promise.all([notifyClosedDebates(), notifyClosedDebates()]);
  check("encerrado pelo admin: avisado uma vez", sentFor(`${title} encerrado`).length === 1);
  check("prazo vencido: avisado uma vez", sentFor(`${title} prazo`).length === 1);
  check("encerrado há 10 dias: não avisa", sentFor(`${title} velho`).length === 0);
  check("aberto: não avisa", sentFor(`${title} aberto`).length === 0);
  const closed = sentFor(`${title} encerrado`)[0];
  check("encerramento: aprovado recebe", Boolean(closed?.to.includes(emailOf(ids.approved))));
  check("encerramento: pendente não recebe", !closed?.to.includes(emailOf(ids.pending)));

  await notifyClosedDebates();
  check("segunda execução: nada repetido", sentFor(`${title} encerrado`).length === 1);

  // Falha no Brevo: libera o debate e a próxima execução tenta de novo.
  await db.update(debates).set({ closedAt: sql`now()` }).where(eq(debates.id, created[4].id));
  failNext = true;
  await notifyClosedDebates();
  check("falha no envio: não marcado", sentFor(`${title} aberto`).length === 0);
  await notifyClosedDebates();
  check("falha no envio: reenviado depois", sentFor(`${title} aberto`).length === 1);
} finally {
  if (debateIds.length) await db.delete(debates).where(inArray(debates.id, debateIds));
  await db.delete(user).where(inArray(user.id, Object.values(ids)));
  if (pendingReal.length) {
    await db.update(debates).set({ closeNotifiedAt: null }).where(inArray(debates.id, pendingReal));
  }
}
process.exit(failed ? 1 : 0);
