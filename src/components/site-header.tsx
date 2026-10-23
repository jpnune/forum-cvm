import Link from "next/link";
import { signOut } from "@/app/auth-actions";
import type { CurrentUser } from "@/lib/session";

export function SiteHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-semibold">
          Fórum do Condomínio
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user.role === "admin" && user.status === "approved" && (
            <Link href="/admin" className="underline">
              Painel
            </Link>
          )}
          <Link href="/conta" className="underline">
            <span className="sm:hidden">Conta</span>
            <span className="hidden sm:inline">
              {user.name} · {user.unitLabel}
            </span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1 dark:border-zinc-700">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
