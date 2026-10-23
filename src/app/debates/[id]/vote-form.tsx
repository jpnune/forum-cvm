"use client";

import { useActionState, useOptimistic } from "react";
import { vote } from "@/app/debates/actions";
import { FormError } from "@/components/form";
import { CHOICES } from "@/lib/choices";
import type { Choice } from "@/lib/votes";

// O voto escolhido já aparece destacado enquanto a action roda; se falhar, volta ao voto real.
export function VoteForm({ debateId, current }: { debateId: string; current: Choice | null }) {
  const [optimistic, setOptimistic] = useOptimistic(current);
  const [state, action, pending] = useActionState(async (prev: { error?: string }, formData: FormData) => {
    setOptimistic(formData.get("choice") as Choice);
    return vote(prev, formData);
  }, {});

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="debateId" value={debateId} />
      <div className="grid grid-cols-3 gap-2">
        {CHOICES.map(({ value, label }) => {
          const selected = optimistic === value;
          return (
            <button
              key={value}
              type="submit"
              name="choice"
              value={value}
              disabled={pending}
              aria-pressed={selected}
              className={`rounded-lg border px-2 py-3 text-sm font-medium disabled:opacity-60 ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">
        {optimistic
          ? "Este é o voto atual do seu apartamento. Qualquer morador do apartamento pode trocá-lo enquanto o debate estiver aberto."
          : "Seu apartamento ainda não votou. Vale 1 voto por apartamento; o último voto é o que conta."}
      </p>
      <FormError message={state.error} />
    </form>
  );
}
