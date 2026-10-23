"use client";

import { useActionState } from "react";
import { setDeadline } from "@/app/debates/actions";
import { FormError, SubmitButton } from "@/components/form";

// Valor para o datetime-local no horário de Brasília (UTC-3, sem horário de verão).
function toLocalInput(date: Date | null) {
  if (!date) return undefined;
  return new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function DeadlineForm({ debateId, current }: { debateId: string; current: Date | null }) {
  const [state, action] = useActionState(setDeadline, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="debateId" value={debateId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{current ? "Mudar prazo" : "Definir prazo"} (horário de Brasília)</span>
          <input
            type="datetime-local"
            name="deadline"
            defaultValue={toLocalInput(current)}
            required
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
          />
        </label>
        <SubmitButton>Salvar prazo</SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
