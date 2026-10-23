"use client";

import { useActionState } from "react";
import { createDebate } from "@/app/debates/actions";
import { Field, FormError, SubmitButton } from "@/components/form";

export function NewDebateForm() {
  const [state, action] = useActionState(createDebate, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Título" name="title" maxLength={150} defaultValue={state.values?.title} required />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Descrição</span>
        <textarea
          name="body"
          rows={8}
          maxLength={10000}
          defaultValue={state.values?.body}
          required
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
        />
        <span className="text-xs text-zinc-500">Explique a proposta. O síndico pode definir um prazo para a votação.</span>
      </label>
      <FormError message={state.error} />
      <SubmitButton>Publicar debate</SubmitButton>
    </form>
  );
}
