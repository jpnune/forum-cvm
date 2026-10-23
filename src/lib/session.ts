import "server-only";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, units } from "@/db/schema";

// Camada de acesso à sessão: toda página e action protegida passa por aqui.
// Sem cache de propósito: aprovação/bloqueio pelo admin vale na hora.

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "resident" | "admin";
  status: "pending" | "approved" | "rejected" | "blocked";
  unitId: number;
  unitLabel: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Cookie vindo de cookies(), não do cabeçalho original: numa Server Action que acabou de
  // trocar a sessão (ex.: troca de senha), o re-render já enxerga o cookie novo.
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const [profile] = await db
    .select({
      name: profiles.name,
      role: profiles.role,
      status: profiles.status,
      unitId: profiles.unitId,
      block: units.block,
      number: units.number,
    })
    .from(profiles)
    .innerJoin(units, eq(units.id, profiles.unitId))
    .where(eq(profiles.userId, session.user.id));
  if (!profile) return null;

  return {
    id: session.user.id,
    name: profile.name,
    email: session.user.email,
    role: profile.role,
    status: profile.status,
    unitId: profile.unitId,
    unitLabel: `Bloco ${profile.block} · Apto ${profile.number}`,
  };
}

// Logado (qualquer status); senão vai para o login.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Logado e aprovado; senão vai para a tela de espera.
export async function requireApproved() {
  const user = await requireUser();
  if (user.status !== "approved") redirect("/aguardando");
  return user;
}

export async function requireAdmin() {
  const user = await requireApproved();
  if (user.role !== "admin") redirect("/");
  return user;
}
