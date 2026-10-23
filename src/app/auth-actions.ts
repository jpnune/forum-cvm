"use server";

import { and, eq } from "drizzle-orm";
import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles, units, user } from "@/db/schema";

// `values` devolve o que foi digitado (nunca a senha) para o formulário não ser apagado no erro.
export type FormState = { error?: string; success?: string; values?: Record<string, string> };

const AUTH_ERRORS: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "E-mail inválido.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Senha longa demais.",
  INVALID_PASSWORD: "Senha atual incorreta.",
};

function authErrorMessage(error: unknown) {
  if (isAPIError(error)) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  }
  // Erro de configuração cai aqui (ex.: BETTER_AUTH_SECRET faltando na Vercel): ver nos logs.
  console.error("[auth] erro inesperado:", error);
  return "Não foi possível concluir. Tente de novo.";
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const block = field(formData, "block").toUpperCase();
  const number = Number(field(formData, "number"));
  const values = { name, email, block, number: field(formData, "number") };

  if (!name || !email || !password || !block || !number) {
    return { error: "Preencha todos os campos.", values };
  }

  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.block, block), eq(units.number, number)));
  if (!unit) {
    return { error: "Apartamento não encontrado. Use andar + apto de 1 a 8 (ex.: 67 = 6º andar, apto 7).", values };
  }

  let userId: string;
  try {
    // nextCookies já grava o cookie de sessão.
    const result = await auth.api.signUpEmail({ body: { name, email, password } });
    userId = result.user.id;
  } catch (error) {
    return { error: authErrorMessage(error), values };
  }

  try {
    // Status nasce `pending`: só acessa o fórum depois que o admin aprovar.
    await db.insert(profiles).values({ userId, unitId: unit.id, name });
  } catch (error) {
    // Sem transação no neon-http: desfaz a conta para não sobrar usuário sem perfil.
    await db.delete(user).where(eq(user.id, userId));
    console.error(error);
    return { error: "Não foi possível concluir o cadastro. Tente de novo.", values };
  }

  redirect("/aguardando");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };
  if (!email || !password) {
    return { error: "Informe e-mail e senha.", values };
  }

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch (error) {
    return { error: authErrorMessage(error), values };
  }

  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Preencha a senha atual e a nova." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "A confirmação não bate com a nova senha." };
  }

  try {
    // Desconecta os outros aparelhos; este continua logado (nextCookies grava o cookie novo).
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  return { success: "Senha alterada. Os outros aparelhos foram desconectados." };
}
