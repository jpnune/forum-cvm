import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Fórum do Condomínio" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Entrar</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Fórum do Condomínio</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium underline">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
