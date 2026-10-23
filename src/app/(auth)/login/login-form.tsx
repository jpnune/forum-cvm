"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";
import { Field, FormError, SubmitButton } from "@/components/form";

export function LoginForm() {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" required />
      <FormError message={state.error} />
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
