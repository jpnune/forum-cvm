import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { requireApproved } from "@/lib/session";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <Forum />
    </Suspense>
  );
}

async function Forum() {
  const user = await requireApproved();
  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-semibold">Debates</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Nenhum debate ainda.</p>
      </main>
    </>
  );
}
