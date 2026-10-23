import "server-only";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { debates, profiles, units } from "@/db/schema";

// Leitura de debates (sem votos: esses ficam em src/lib/votes.ts).

// Aberto = não encerrado pelo admin e sem prazo ou antes do prazo (mesma regra de votes.ts).
const isOpen = sql<boolean>`(${and(
  isNull(debates.closedAt),
  or(isNull(debates.deadline), gt(debates.deadline, sql`now()`)),
)})`;

const debateFields = {
  id: debates.id,
  title: debates.title,
  deadline: debates.deadline,
  closedAt: debates.closedAt,
  createdAt: debates.createdAt,
  isOpen,
  authorName: profiles.name,
  authorBlock: units.block,
  authorNumber: units.number,
};

export type DebateSummary = Awaited<ReturnType<typeof listDebates>>[number];

// Abertos primeiro; dentro de cada grupo, os mais novos primeiro.
export async function listDebates() {
  return db
    .select(debateFields)
    .from(debates)
    .leftJoin(profiles, eq(profiles.userId, debates.authorId))
    .leftJoin(units, eq(units.id, profiles.unitId))
    .orderBy(desc(isOpen), desc(debates.createdAt));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getDebate(id: string) {
  // id fora do formato faria o Postgres dar erro; trata como inexistente.
  if (!UUID.test(id)) return null;
  const [debate] = await db
    .select({ ...debateFields, body: debates.body, authorId: debates.authorId })
    .from(debates)
    .leftJoin(profiles, eq(profiles.userId, debates.authorId))
    .leftJoin(units, eq(units.id, profiles.unitId))
    .where(eq(debates.id, id));
  return debate ?? null;
}

export function authorLabel(d: Pick<DebateSummary, "authorName" | "authorBlock" | "authorNumber">) {
  if (!d.authorName) return "Morador removido";
  return `${d.authorName} · Bloco ${d.authorBlock} · Apto ${d.authorNumber}`;
}

// Datas sempre no horário de Brasília, independente do fuso do servidor.
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(date: Date) {
  return dateTimeFormat.format(date);
}
