// Teste manual das regras de voto contra o banco real. Cria dados `test-` e apaga no fim.
// Uso: npm run db:test-votes
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { debates, profiles, units, user } from "@/db/schema";
import { castVote, getMyUnitVote, getResults } from "@/lib/votes";

const stamp = Date.now();
const userIds = [`test-${stamp}-1`, `test-${stamp}-2`];

const [unit] = await db
  .select({ id: units.id })
  .from(units)
  .where(and(eq(units.block, "A"), eq(units.number, 11)));
if (!unit) throw new Error("Rode `npm run db:seed` antes.");

let failed = false;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "OK  " : "FALHOU"} ${label}`);
  if (!ok) failed = true;
}

try {
  await db.insert(user).values(
    userIds.map((id, i) => ({ id, name: `Teste ${i + 1}`, email: `${id}@example.test` })),
  );
  await db.insert(profiles).values(
    userIds.map((userId, i) => ({ userId, unitId: unit.id, name: `Teste ${i + 1}`, status: "approved" as const })),
  );
  const [debate] = await db
    .insert(debates)
    .values({ title: "test debate", body: "test", authorId: userIds[0] })
    .returning({ id: debates.id });

  await castVote(userIds[0], debate.id, "for");
  console.log("Morador 1 do A-11 votou: for", await getResults(debate.id));

  await castVote(userIds[1], debate.id, "against");
  const results = await getResults(debate.id);
  console.log("Morador 2 do A-11 votou: against", results);

  check("apartamento tem 1 voto só", results.total === 1);
  check("vale o último voto (against)", results.against === 1 && results.for === 0);
  check("morador 1 vê o voto do apartamento", (await getMyUnitVote(userIds[0], debate.id)) === "against");
  check("morador 2 vê o voto do apartamento", (await getMyUnitVote(userIds[1], debate.id)) === "against");

  await db.update(debates).set({ closedAt: new Date() }).where(eq(debates.id, debate.id));
  const closedError = await castVote(userIds[0], debate.id, "abstain").catch((e: Error) => e);
  check("debate encerrado recusa voto", closedError instanceof Error);

  await db.update(profiles).set({ status: "pending" }).where(eq(profiles.userId, userIds[0]));
  await db.update(debates).set({ closedAt: null }).where(eq(debates.id, debate.id));
  const pendingError = await castVote(userIds[0], debate.id, "abstain").catch((e: Error) => e);
  check("morador não aprovado não vota", pendingError instanceof Error);

  await db.delete(debates).where(eq(debates.id, debate.id));
} finally {
  // profiles caem em cascata
  await db.delete(debates).where(inArray(debates.authorId, userIds));
  await db.delete(user).where(inArray(user.id, userIds));
}

if (failed) process.exit(1);
console.log("Tudo certo.");
