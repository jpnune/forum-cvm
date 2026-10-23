"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { profiles, statusEnum, user } from "@/db/schema";

type Status = (typeof statusEnum.enumValues)[number];

export async function setStatus(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "") as Status;

  if (!userId || !statusEnum.enumValues.includes(status)) {
    throw new Error("Pedido inválido.");
  }
  // Evita o admin se trancar fora do painel.
  if (userId === admin.id) {
    throw new Error("Você não pode alterar o próprio cadastro.");
  }

  await db.update(profiles).set({ status }).where(eq(profiles.userId, userId));
  refresh();
}

// Apaga a conta (perfil e sessões vão junto). Votos, debates e comentários ficam, sem autor:
// o voto continua valendo para o apartamento.
export async function deleteMember(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Pedido inválido.");
  if (userId === admin.id) {
    throw new Error("Você não pode excluir a própria conta.");
  }

  await db.delete(user).where(eq(user.id, userId));
  refresh();
}
