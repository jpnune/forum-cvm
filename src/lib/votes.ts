import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { choiceEnum, debates, profiles, votes } from "@/db/schema";

// Voto secreto: este é o único arquivo que acessa a tabela `votes`.
// Só expõe totais e o voto do próprio apartamento; nunca quem votou o quê.

export type Choice = (typeof choiceEnum.enumValues)[number];

export type Results = Record<Choice, number> & { total: number };

// Aberto = não encerrado pelo admin e sem prazo ou antes do prazo.
const debateIsOpen = and(
  isNull(debates.closedAt),
  or(isNull(debates.deadline), gt(debates.deadline, sql`now()`)),
);

export async function castVote(userId: string, debateId: string, choice: Choice) {
  if (!choiceEnum.enumValues.includes(choice)) {
    throw new Error("Voto inválido.");
  }

  // O apartamento vem do perfil, nunca de quem chama.
  const [profile] = await db
    .select({ unitId: profiles.unitId, status: profiles.status })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (!profile || profile.status !== "approved") {
    throw new Error("Cadastro não aprovado.");
  }

  const [debate] = await db
    .select({ id: debates.id })
    .from(debates)
    .where(and(eq(debates.id, debateId), debateIsOpen));
  if (!debate) {
    throw new Error("Debate encerrado ou inexistente.");
  }

  // 1 voto por apartamento: o último voto sobrescreve o anterior.
  await db
    .insert(votes)
    .values({ debateId, unitId: profile.unitId, userId, choice })
    .onConflictDoUpdate({
      target: [votes.debateId, votes.unitId],
      set: { choice, userId, updatedAt: sql`now()` },
    });
}

export async function getResults(debateId: string): Promise<Results> {
  const rows = await db
    .select({ choice: votes.choice, count: sql<number>`count(*)::int` })
    .from(votes)
    .where(eq(votes.debateId, debateId))
    .groupBy(votes.choice);

  const results: Results = { for: 0, against: 0, abstain: 0, total: 0 };
  for (const row of rows) {
    results[row.choice] = row.count;
    results.total += row.count;
  }
  return results;
}

export async function getMyUnitVote(userId: string, debateId: string): Promise<Choice | null> {
  const [row] = await db
    .select({ choice: votes.choice })
    .from(votes)
    .innerJoin(profiles, eq(profiles.unitId, votes.unitId))
    .where(and(eq(profiles.userId, userId), eq(votes.debateId, debateId)));
  return row?.choice ?? null;
}
