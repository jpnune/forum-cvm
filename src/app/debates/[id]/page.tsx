import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/form";
import { DebateStatus } from "@/components/debate-status";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { CHOICES, choiceLabel } from "@/lib/choices";
import { authorLabel, countUnits, formatDateTime, getDebate } from "@/lib/debates";
import { requireApproved } from "@/lib/session";
import { getMyUnitVote, getResults, type Choice, type Results } from "@/lib/votes";
import { closeDebate, deleteDebate, removeDeadline } from "../actions";
import { AutoRefresh } from "./auto-refresh";
import { DeadlineForm } from "./deadline-form";
import { VoteForm } from "./vote-form";

type Debate = NonNullable<Awaited<ReturnType<typeof getDebate>>>;

export default function DebatePage(props: PageProps<"/debates/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <DebateView params={props.params} />
    </Suspense>
  );
}

async function DebateView({ params }: { params: PageProps<"/debates/[id]">["params"] }) {
  const user = await requireApproved();
  const { id } = await params;
  const debate = await getDebate(id);
  if (!debate) notFound();
  const [results, myVote, unitCount] = await Promise.all([
    getResults(debate.id),
    getMyUnitVote(user.id, debate.id),
    countUnits(),
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
        <Link href="/" className="text-sm underline">
          ← Todos os debates
        </Link>
        <article className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 text-2xl font-semibold break-words">{debate.title}</h1>
            <DebateStatus debate={debate} />
          </div>
          <p className="text-xs text-zinc-500">
            {authorLabel(debate)} · {formatDateTime(debate.createdAt)}
          </p>
          <p className="whitespace-pre-wrap break-words">{debate.body}</p>
          {!debate.isOpen && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Encerrado em {formatDateTime(debate.closedAt ?? debate.deadline!)}. Votos e comentários congelados.
            </p>
          )}
        </article>
        <Voting debate={debate} results={results} myVote={myVote} unitCount={unitCount} />
        {/* Só enquanto aberto: depois de encerrado o resultado não muda mais. */}
        {debate.isOpen && <AutoRefresh />}
        {user.role === "admin" && <AdminControls debate={debate} />}
      </main>
    </>
  );
}

function Voting({
  debate,
  results,
  myVote,
  unitCount,
}: {
  debate: Debate;
  results: Results;
  myVote: Choice | null;
  unitCount: number;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">{debate.isOpen ? "Votação" : "Resultado final"}</h2>
      {debate.isOpen ? (
        <VoteForm debateId={debate.id} current={myVote} />
      ) : (
        <p className="text-sm">
          {myVote ? `Seu apartamento votou: ${choiceLabel(myVote)}.` : "Seu apartamento não votou."}
        </p>
      )}
      <ResultBars results={results} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {results.total} de {unitCount} apartamentos votaram. O voto é secreto: só aparecem os totais.
      </p>
    </section>
  );
}

function ResultBars({ results }: { results: Results }) {
  return (
    <ul className="flex flex-col gap-3">
      {CHOICES.map(({ value, label }) => {
        const count = results[value];
        const percent = results.total ? Math.round((count / results.total) * 100) : 0;
        return (
          <li key={value} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums">
                {count} {count === 1 ? "voto" : "votos"} · {percent}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${BAR_COLORS[value]}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const BAR_COLORS: Record<Choice, string> = {
  for: "bg-green-600",
  against: "bg-red-600",
  abstain: "bg-zinc-400",
};

function AdminControls({ debate }: { debate: Debate }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Síndico</h2>
      {debate.isOpen && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {debate.deadline ? `Prazo: ${formatDateTime(debate.deadline)}` : "Sem prazo: fica aberto até você encerrar."}
          </p>
          <DeadlineForm debateId={debate.id} current={debate.deadline} />
          {debate.deadline && (
            <form action={removeDeadline}>
              <input type="hidden" name="debateId" value={debate.id} />
              <button type="submit" className="text-sm underline">
                Remover prazo
              </button>
            </form>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {debate.isOpen && (
          <form action={closeDebate}>
            <input type="hidden" name="debateId" value={debate.id} />
            <ConfirmButton
              confirm="Encerrar este debate agora? Votos e comentários ficam congelados."
              className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
            >
              Encerrar debate
            </ConfirmButton>
          </form>
        )}
        <form action={deleteDebate}>
          <input type="hidden" name="debateId" value={debate.id} />
          <ConfirmButton
            confirm="Remover este debate com todos os votos e comentários? Não dá para desfazer."
            className="rounded-lg bg-red-700 px-3 py-1 text-sm text-white"
          >
            Remover debate
          </ConfirmButton>
        </form>
      </div>
    </section>
  );
}
