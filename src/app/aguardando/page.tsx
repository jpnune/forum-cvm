import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOut } from "@/app/auth-actions";
import { Loading } from "@/components/loading";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Aguardando aprovação · Fórum do Condomínio" };

const MESSAGES = {
  pending: {
    title: "Aguardando aprovação",
    body: "Seu cadastro foi recebido. Assim que o síndico aprovar, você terá acesso ao fórum.",
  },
  rejected: {
    title: "Cadastro não aprovado",
    body: "Seu cadastro não foi aprovado. Em caso de dúvida, fale com o síndico.",
  },
  blocked: {
    title: "Acesso bloqueado",
    body: "Seu acesso ao fórum foi bloqueado. Em caso de dúvida, fale com o síndico.",
  },
};

export default function WaitingPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <Suspense fallback={<Loading />}>
          <Status />
        </Suspense>
      </div>
    </main>
  );
}

async function Status() {
  const user = await requireUser();
  if (user.status === "approved") redirect("/");
  const message = MESSAGES[user.status];
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">{message.title}</h1>
      <p className="mb-2 text-zinc-600 dark:text-zinc-400">{message.body}</p>
      <p className="mb-6 text-sm text-zinc-500">
        {user.name} · {user.unitLabel}
      </p>
      <form action={signOut}>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Sair
        </button>
      </form>
    </>
  );
}
