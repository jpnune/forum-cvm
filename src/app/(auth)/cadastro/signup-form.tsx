"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth-actions";
import { Field, FormError, SubmitButton } from "@/components/form";

const BLOCKS = ["A", "B"];

export function SignupForm() {
  const [state, action] = useActionState(signUp, {});
  const values = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nome" name="name" autoComplete="name" defaultValue={values.name} required />
      <div className="grid grid-cols-2 gap-3">
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1 font-medium">Bloco</legend>
          <div className="flex gap-2">
            {BLOCKS.map((block) => (
              <label
                key={block}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 py-2 text-base has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white dark:border-zinc-700 dark:has-[:checked]:border-zinc-100 dark:has-[:checked]:bg-zinc-100 dark:has-[:checked]:text-zinc-900"
              >
                <input
                  type="radio"
                  name="block"
                  value={block}
                  defaultChecked={values.block === block}
                  required
                  className="sr-only"
                />
                {block}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Apartamento" name="number" inputMode="numeric" pattern="[0-9]{3,4}" placeholder="Ex.: 101" defaultValue={values.number} required />
      </div>
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={values.email} required />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <FormError message={state.error} />
      <SubmitButton>Criar conta</SubmitButton>
    </form>
  );
}
