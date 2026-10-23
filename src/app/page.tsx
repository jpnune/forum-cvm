import Link from "next/link";
import { Suspense } from "react";
import { DebateStatus } from "@/components/debate-status";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { authorLabel, formatDateTime, listDebates } from "@/lib/debates";
import { requireApproved } from "@/lib/session";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <Forum />
    </Suspense>
  );
}

async function Forum() {
  const user = await requireApproved();
  const debates = await listDebates();
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
        {debates.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Nenhum debate ainda. Que tal abrir o primeiro?</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {debates.map((d) => (
              <li key={d.id}>
                <Link href={`/debates/${d.id}`} className="flex flex-col gap-1 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 font-medium break-words">{d.title}</span>
                    <DebateStatus debate={d} />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {authorLabel(d)} · {formatDateTime(d.createdAt)}
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
