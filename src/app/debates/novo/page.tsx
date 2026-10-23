import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { requireApproved } from "@/lib/session";
import { NewDebateForm } from "./new-debate-form";

export const metadata: Metadata = { title: "Novo debate · Fórum do Condomínio" };

export default function NewDebatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewDebate />
    </Suspense>
  );
}

async function NewDebate() {
  const user = await requireApproved();
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-semibold">Novo debate</h1>
        <NewDebateForm />
      </main>
    </>
  );
}
