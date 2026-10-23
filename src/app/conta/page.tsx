import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/session";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Minha conta · Fórum do Condomínio" };

export default function AccountPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireUser();
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Minha conta</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.name} · {user.unitLabel} · {user.email}
          </p>
        </div>
        <section className="flex max-w-sm flex-col gap-3">
          <h2 className="text-lg font-semibold">Alterar senha</h2>
          <PasswordForm />
        </section>
      </main>
    </>
  );
}
