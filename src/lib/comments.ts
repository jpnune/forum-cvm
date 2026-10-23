import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isOpen } from "@/lib/debates";
import { comments, debates, profiles, units } from "@/db/schema";

// Comentários: leitura e escrita (quem chama já validou sessão e aprovação).

export const COMMENT_MAX = 5_000;

export type Comment = Awaited<ReturnType<typeof listComments>>[number];

// Mais antigos primeiro, como uma conversa.
export async function listComments(debateId: string) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: profiles.name,
      authorBlock: units.block,
      authorNumber: units.number,
    })
    .from(comments)
    .leftJoin(profiles, eq(profiles.userId, comments.authorId))
    .leftJoin(units, eq(units.id, profiles.unitId))
    .where(eq(comments.debateId, debateId))
    .orderBy(asc(comments.createdAt));
}

// Insere só se o debate estiver aberto, na mesma consulta (sem corrida com o encerramento).
// Devolve false quando o debate está encerrado ou não existe.
export async function addComment(userId: string, debateId: string, body: string) {
  const inserted = await db
    .insert(comments)
    .select(
      db
        .select({
          id: sql`gen_random_uuid()`.as("id"),
          debateId: debates.id,
          authorId: sql`${userId}`.as("author_id"),
          body: sql`${body}`.as("body"),
          createdAt: sql`now()`.as("created_at"),
        })
        .from(debates)
        .where(and(eq(debates.id, debateId), isOpen)),
    )
    .returning({ id: comments.id });
  return inserted.length > 0;
}

// Admin remove sempre (moderação); o autor só enquanto o debate está aberto.
// Devolve false se não tinha permissão ou o comentário já não existia.
export async function removeComment(commentId: string, user: { id: string; role: string }) {
  const condition =
    user.role === "admin"
      ? eq(comments.id, commentId)
      : and(
          eq(comments.id, commentId),
          eq(comments.authorId, user.id),
          inArray(comments.debateId, db.select({ id: debates.id }).from(debates).where(isOpen)),
        );
  const deleted = await db.delete(comments).where(condition).returning({ id: comments.id });
  return deleted.length > 0;
}
