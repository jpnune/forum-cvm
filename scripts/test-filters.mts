// Teste manual de "não lidos" e da ordenação da lista. Cria dados `test-` e apaga no fim.
// Uso: npm run db:test-filters
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { debates, profiles, units, user } from "@/db/schema";
import { addComment } from "@/lib/comments";
import { listDebates, markAllRead, markRead } from "@/lib/debates";
import { castVote } from "@/lib/votes";

const stamp = Date.now();
const userIds = [`test-${stamp}-1`, `test-${stamp}-2`];
const [me, other] = userIds;

const unitRows = await db
  .select({ id: units.id })
  .from(units)
  .where(and(eq(units.block, "A"), inArray(units.number, [11, 12])));
if (unitRows.length < 2) throw new Error("Rode `npm run db:seed` antes.");

let failed = false;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "OK  " : "FALHOU"} ${label}`);
  if (!ok) failed = true;
}
// Só os debates deste teste (o banco pode ter outros).
const mine = async (...args: Parameters<typeof listDebates>) =>
  (await listDebates(...args)).filter((d) => d.authorId === me || d.authorId === other);

try {
  await db.insert(user).values(userIds.map((id, i) => ({ id, name: `Teste ${i + 1}`, email: `${id}@example.test` })));
  await db.insert(profiles).values(
    userIds.map((userId, i) => ({ userId, unitId: unitRows[i].id, name: `Teste ${i + 1}`, status: "approved" as const })),
  );
  const [a, b] = await db
    .insert(debates)
    .values([
      { title: "test A", body: "test", authorId: other },
      { title: "test B", body: "test", authorId: me },
    ])
    .returning({ id: debates.id });

  let list = await mine(me, "nao-lidos");
  check("debates nunca abertos são não lidos", list.length === 2);

  await markRead(me, a.id);
  await addComment(me, a.id, "meu comentário");
  list = await mine(me, "nao-lidos");
  check("abrir marca como lido; meu próprio comentário não conta", list.length === 1 && list[0].id === b.id);

  await addComment(other, a.id, "comentário de outro");
  list = await mine(me, "nao-lidos");
  const itemA = list.find((d) => d.id === a.id);
  check("comentário de outro deixa não lido de novo", itemA?.newComments === 1);

  await markAllRead(me);
  check("marcar todos como lidos", (await mine(me, "nao-lidos")).length === 0);
  check("leitura é por usuário", (await mine(other, "nao-lidos")).length === 2);

  check("filtro meus", (await mine(me, "meus")).map((d) => d.id).join() === b.id);

  await castVote(me, b.id, "for");
  await castVote(other, b.id, "against");
  await castVote(me, a.id, "for");
  list = await mine(me, "todos", "votados");
  check("mais votados", list[0].id === b.id && list[0].voteCount === 2);
  list = await mine(me, "todos", "comentados");
  check("mais comentados", list[0].id === a.id && list[0].commentCount === 2);
  list = await mine(me, "todos", "recentes");
  check("mais recentes", list.length === 2);
} finally {
  await db.delete(debates).where(inArray(debates.authorId, userIds));
  await db.delete(user).where(inArray(user.id, userIds));
}
if (failed) process.exit(1);
