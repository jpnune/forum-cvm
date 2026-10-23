import "server-only";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, debateReads, debates, profiles, units } from "@/db/schema";
import { getVoteTotals } from "@/lib/votes";

// Leitura de debates (sem votos: esses ficam em src/lib/votes.ts).

// Aberto = não encerrado pelo admin e sem prazo ou antes do prazo (mesma regra de votes.ts).
export const isOpen = sql<boolean>`(${and(
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

// Filtros e ordens da lista (valores usados na URL: ?ver=...&ordem=...).
export const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "nao-lidos", label: "Não lidos" },
  { value: "abertos", label: "Abertos" },
  { value: "encerrados", label: "Encerrados" },
  { value: "meus", label: "Meus" },
] as const;
export const SORTS = [
  { value: "abertos", label: "Abertos primeiro" },
  { value: "recentes", label: "Mais recentes" },
  { value: "votados", label: "Mais votados" },
  { value: "comentados", label: "Mais comentados" },
] as const;
export type Filter = (typeof FILTERS)[number]["value"];
export type Sort = (typeof SORTS)[number]["value"];

export function parseFilter(value: unknown): Filter {
  return FILTERS.find((f) => f.value === value)?.value ?? "todos";
}
export function parseSort(value: unknown): Sort {
  return SORTS.find((s) => s.value === value)?.value ?? "abertos";
}

// Lista do ponto de vista de um usuário: "não lido" = nunca abriu o debate ou
// há comentários de outras pessoas depois da última vez que abriu.
export async function listDebates(userId: string, filter: Filter = "todos", sort: Sort = "abertos") {
  const commentCount = sql<number>`(select count(*)::int from ${comments} c where c.debate_id = ${debates.id})`;
  const newComments = sql<number>`(select count(*)::int from ${comments} c
    where c.debate_id = ${debates.id} and c.created_at > ${debateReads.readAt}
      and c.author_id is distinct from ${userId})`;
  const unread = sql<boolean>`(${debateReads.readAt} is null or ${newComments} > 0)`;

  const where = {
    todos: undefined,
    "nao-lidos": unread,
    abertos: isOpen,
    encerrados: sql`not ${isOpen}`,
    meus: eq(debates.authorId, userId),
  }[filter];
  const order = {
    abertos: [desc(isOpen), desc(debates.createdAt)],
    recentes: [desc(debates.createdAt)],
    // Reordenado abaixo pelos votos; aqui fica o desempate.
    votados: [desc(debates.createdAt)],
    comentados: [desc(commentCount), desc(debates.createdAt)],
  }[sort];

  const [rows, voteTotals] = await Promise.all([
    db
      .select({
        ...debateFields,
        authorId: debates.authorId,
        commentCount,
        newComments,
        unread,
        neverRead: sql<boolean>`(${debateReads.readAt} is null)`,
      })
      .from(debates)
      .leftJoin(profiles, eq(profiles.userId, debates.authorId))
      .leftJoin(units, eq(units.id, profiles.unitId))
      .leftJoin(debateReads, and(eq(debateReads.debateId, debates.id), eq(debateReads.userId, userId)))
      .where(where)
      .orderBy(...order),
    getVoteTotals(),
  ]);

  const list = rows.map((row) => ({ ...row, voteCount: voteTotals.get(row.id) ?? 0 }));
  // sort é estável: empates continuam do mais novo para o mais velho.
  if (sort === "votados") list.sort((a, b) => b.voteCount - a.voteCount);
  return list;
}

// Quantos debates o usuário ainda não leu (contador do filtro).
export async function countUnread(userId: string) {
  const all = await listDebates(userId);
  return all.filter((d) => d.unread).length;
}

// Marca como lido agora. Chamado ao abrir a página do debate.
export async function markRead(userId: string, debateId: string) {
  await db
    .insert(debateReads)
    .values({ userId, debateId })
    .onConflictDoUpdate({ target: [debateReads.userId, debateReads.debateId], set: { readAt: sql`now()` } });
}

export async function markAllRead(userId: string) {
  await db.execute(sql`
    insert into ${debateReads} (user_id, debate_id, read_at)
    select ${userId}, ${debates.id}, now() from ${debates}
    on conflict (user_id, debate_id) do update set read_at = now()`);
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

// Total de apartamentos cadastrados (256), base do "X de N apartamentos votaram".
export async function countUnits() {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(units);
  return row.count;
}
