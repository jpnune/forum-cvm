import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Cadastro · Fórum do Condomínio" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Cadastro</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Sua conta será liberada depois que o síndico aprovar.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
