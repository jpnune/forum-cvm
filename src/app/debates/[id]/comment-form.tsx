"use client";

import { useActionState } from "react";
import { comment } from "@/app/debates/actions";
import { FormError, SubmitButton } from "@/components/form";

export function CommentForm({ debateId }: { debateId: string }) {
  // Com sucesso o formulário é limpo; com erro, o texto digitado volta pelo defaultValue.
  const [state, action] = useActionState(comment, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="debateId" value={debateId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Seu comentário</span>
        <textarea
          name="body"
          rows={3}
          maxLength={5000}
          defaultValue={state.values?.body}
          required
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
        />
      </label>
      <FormError message={state.error} />
      <div>
        <SubmitButton>Comentar</SubmitButton>
      </div>
    </form>
  );
}
