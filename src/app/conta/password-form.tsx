"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/auth-actions";
import { FormError, PasswordField, SubmitButton } from "@/components/form";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <PasswordField label="Senha atual" name="currentPassword" autoComplete="current-password" required />
      <PasswordField label="Nova senha" name="newPassword" autoComplete="new-password" minLength={8} required />
      <PasswordField label="Repita a nova senha" name="confirmPassword" autoComplete="new-password" minLength={8} required />
      <FormError message={state.error} />
      {state.success && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          {state.success}
        </p>
      )}
      <SubmitButton>Alterar senha</SubmitButton>
    </form>
  );
}
