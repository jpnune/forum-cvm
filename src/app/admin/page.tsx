import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { profiles, units, user } from "@/db/schema";
import { setStatus } from "./actions";

export const metadata: Metadata = { title: "Painel · Fórum do Condomínio" };

type Member = Awaited<ReturnType<typeof getMembers>>[number];
type Action = { status: Member["status"]; label: string; danger?: boolean };

async function getMembers() {
  return db
    .select({
      userId: profiles.userId,
      name: profiles.name,
      email: user.email,
      role: profiles.role,
      status: profiles.status,
      block: units.block,
      number: units.number,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .innerJoin(units, eq(units.id, profiles.unitId))
    .orderBy(asc(units.block), asc(units.number), asc(profiles.createdAt));
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Panel />
    </Suspense>
  );
}

async function Panel() {
  const admin = await requireAdmin();
  const members = await getMembers();
  const byStatus = (status: Member["status"]) => members.filter((m) => m.status === status);

  return (
    <>
      <SiteHeader user={admin} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4">
        <h1 className="text-2xl font-semibold">Painel do síndico</h1>
        <Section
          title="Cadastros pendentes"
          empty="Nenhum cadastro aguardando."
          members={byStatus("pending")}
          adminId={admin.id}
          actions={[
            { status: "approved", label: "Aprovar" },
            { status: "rejected", label: "Rejeitar", danger: true },
          ]}
        />
        <Section
          title="Moradores ativos"
          empty="Nenhum morador aprovado."
          members={byStatus("approved")}
          adminId={admin.id}
          actions={[{ status: "blocked", label: "Bloquear", danger: true }]}
        />
        <Section
          title="Bloqueados e rejeitados"
          empty="Ninguém aqui."
          members={[...byStatus("blocked"), ...byStatus("rejected")]}
          adminId={admin.id}
          actions={[{ status: "approved", label: "Liberar acesso" }]}
        />
      </main>
    </>
  );
}

const STATUS_LABEL: Record<Member["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  blocked: "Bloqueado",
};

function Section({
  title,
  empty,
  members,
  adminId,
  actions,
}: {
  title: string;
  empty: string;
  members: Member[];
  adminId: string;
  actions: Action[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {title} <span className="text-zinc-500">({members.length})</span>
      </h2>
      {members.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {m.name}
                  {m.role === "admin" && <span className="ml-2 text-xs text-zinc-500">síndico</span>}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Bloco {m.block} · Apto {m.number}
                  {(m.status === "blocked" || m.status === "rejected") && ` · ${STATUS_LABEL[m.status]}`}
                </p>
                <p className="truncate text-xs text-zinc-500">{m.email}</p>
              </div>
              {m.userId !== adminId && (
                <div className="flex gap-2">
                  {actions.map((a) => (
                    <form key={a.status} action={setStatus}>
                      <input type="hidden" name="userId" value={m.userId} />
                      <input type="hidden" name="status" value={a.status} />
                      <button
                        type="submit"
                        className={
                          a.danger
                            ? "rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
                            : "rounded-lg bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                        }
                      >
                        {a.label}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
