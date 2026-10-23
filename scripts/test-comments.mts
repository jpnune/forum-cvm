// Teste manual das regras de comentário contra o banco real. Cria dados `test-` e apaga no fim.
// Uso: npm run db:test-comments
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { debates, profiles, units, user } from "@/db/schema";
import { addComment, listComments, removeComment } from "@/lib/comments";

const stamp = Date.now();
const userIds = [`test-${stamp}-1`, `test-${stamp}-2`];
const author = { id: userIds[0], role: "resident" };
const other = { id: userIds[1], role: "resident" };
const admin = { id: "admin", role: "admin" };

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

  check("comenta em debate aberto", await addComment(author.id, debate.id, "primeiro"));
  await addComment(author.id, debate.id, "segundo");
  await addComment(author.id, debate.id, "terceiro");
  let list = await listComments(debate.id);
  check("lista 3 comentários com o autor", list.length === 3 && list[0].authorName === "Teste 1");

  check("outro morador não remove", !(await removeComment(list[0].id, other)));
  check("autor remove o próprio (aberto)", await removeComment(list[0].id, author));

  await db.update(debates).set({ closedAt: sql`now()` }).where(eq(debates.id, debate.id));
  check("não comenta em debate encerrado", !(await addComment(author.id, debate.id, "tarde")));
  list = await listComments(debate.id);
  check("autor não remove depois de encerrado", !(await removeComment(list[0].id, author)));
  check("admin remove depois de encerrado", await removeComment(list[0].id, admin));
  check("sobra 1 comentário", (await listComments(debate.id)).length === 1);
} finally {
  await db.delete(debates).where(inArray(debates.authorId, userIds));
  await db.delete(user).where(inArray(user.id, userIds));
}
if (failed) process.exit(1);
