"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

// Peças de formulário compartilhadas entre login, cadastro e painel.

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
        {...props}
      />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {message}
    </p>
  );
}
