import Link from "next/link";
import { after } from "next/server";
import { Suspense } from "react";
import { DebateStatus } from "@/components/debate-status";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import {
  authorLabel,
  countUnread,
  FILTERS,
  formatDateTime,
  listDebates,
  parseFilter,
  parseSort,
  SORTS,
  type Filter,
  type Sort,
} from "@/lib/debates";
import { notifyClosedDebates } from "@/lib/notifications";
import { requireApproved } from "@/lib/session";
import { markAllDebatesRead } from "./debates/actions";

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<Loading />}>
      <Forum searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Forum({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireApproved();
  // Prazo vencido entre uma execução do cron e outra: o aviso sai na próxima visita.
  after(notifyClosedDebates);
  const params = await searchParams;
  const filter = parseFilter(params.ver);
  const sort = parseSort(params.ordem);
  const [debates, unreadCount] = await Promise.all([listDebates(user.id, filter, sort), countUnread(user.id)]);
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Debates</h1>
          <Link
            href="/debates/novo"
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Novo debate
          </Link>
        </div>
        <Filters filter={filter} sort={sort} unreadCount={unreadCount} />
        {filter === "nao-lidos" && unreadCount > 0 && (
          <form action={markAllDebatesRead}>
            <button type="submit" className="text-sm underline">
              Marcar todos como lidos
            </button>
          </form>
        )}
        {debates.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{EMPTY[filter]}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {debates.map((d) => (
              <li key={d.id}>
                <Link href={`/debates/${d.id}`} className="flex flex-col gap-1 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`min-w-0 break-words ${d.unread ? "font-semibold" : "font-medium"}`}>
                      {d.unread && (
                        <span className="mr-1.5 inline-block size-2 rounded-full bg-blue-600 align-middle" aria-label="Não lido" />
                      )}
                      {d.title}
                    </span>
                    <DebateStatus debate={d} />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {authorLabel(d)} · {formatDateTime(d.createdAt)}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {d.voteCount} {d.voteCount === 1 ? "voto" : "votos"} · {d.commentCount}{" "}
                    {d.commentCount === 1 ? "comentário" : "comentários"}
                    {d.neverRead ? (
                      <span className="text-blue-700 dark:text-blue-300"> · Novo</span>
                    ) : (
                      d.newComments > 0 && (
                        <span className="text-blue-700 dark:text-blue-300">
                          {" "}
                          · {d.newComments} {d.newComments === 1 ? "comentário novo" : "comentários novos"}
                        </span>
                      )
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

const EMPTY: Record<Filter, string> = {
  todos: "Nenhum debate ainda. Que tal abrir o primeiro?",
  "nao-lidos": "Tudo lido por aqui.",
  abertos: "Nenhum debate aberto.",
  encerrados: "Nenhum debate encerrado.",
  meus: "Você ainda não abriu nenhum debate.",
};

// Filtro e ordem ficam na URL (?ver=...&ordem=...): o "voltar" do navegador funciona.
function href(filter: Filter, sort: Sort) {
  const params = new URLSearchParams();
  if (filter !== "todos") params.set("ver", filter);
  if (sort !== "abertos") params.set("ordem", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function Filters({ filter, sort, unreadCount }: { filter: Filter; sort: Sort; unreadCount: number }) {
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 dark:border-zinc-700"
    }`;
  return (
    <div className="flex flex-col gap-2">
      <nav aria-label="Filtrar debates" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={href(value, sort)}
            aria-current={filter === value ? "page" : undefined}
            className={chip(filter === value)}
          >
            {label}
            {value === "nao-lidos" && unreadCount > 0 && ` (${unreadCount})`}
          </Link>
        ))}
      </nav>
      <nav aria-label="Ordenar debates" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-zinc-500">Ordenar:</span>
        {SORTS.map(({ value, label }) => (
          <Link
            key={value}
            href={href(filter, value)}
            aria-current={sort === value ? "page" : undefined}
            className={sort === value ? "font-semibold underline" : "text-zinc-600 dark:text-zinc-400"}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
