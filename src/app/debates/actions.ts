"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type { FormState } from "@/app/auth-actions";
import { addComment, COMMENT_MAX, removeComment } from "@/lib/comments";
import { db } from "@/lib/db";
import { markAllRead, markRead } from "@/lib/debates";
import { notifyClosedDebates, notifyNewDebate } from "@/lib/notifications";
import { requireAdmin, requireApproved } from "@/lib/session";
import { castVote, type Choice } from "@/lib/votes";
import { debates } from "@/db/schema";

const TITLE_MAX = 150;
const BODY_MAX = 10_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createDebate(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireApproved();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const values = { title, body };

  if (!title || !body) {
    return { error: "Preencha o título e a descrição.", values };
  }
  if (title.length > TITLE_MAX) {
    return { error: `O título pode ter no máximo ${TITLE_MAX} caracteres.`, values };
  }
  if (body.length > BODY_MAX) {
    return { error: `A descrição pode ter no máximo ${BODY_MAX} caracteres.`, values };
  }

  // Nasce sem prazo; quem define o prazo é o admin.
  const [debate] = await db
    .insert(debates)
    .values({ title, body, authorId: user.id })
    .returning({ id: debates.id });
  // E-mail depois da resposta, para não atrasar quem criou.
  after(() => notifyNewDebate(debate.id).catch((error) => console.error("[email] aviso de debate novo", error)));
  redirect(`/debates/${debate.id}`);
}

function debateId(formData: FormData) {
  const id = String(formData.get("debateId") ?? "");
  if (!id) throw new Error("Pedido inválido.");
  return id;
}

// O campo datetime-local vem sem fuso: é sempre horário de Brasília (UTC-3, sem horário de verão).
export async function setDeadline(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = debateId(formData);
  const value = String(formData.get("deadline") ?? "");
  const deadline = new Date(`${value}:00-03:00`);

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || Number.isNaN(deadline.getTime())) {
    return { error: "Informe data e hora." };
  }
  if (deadline <= new Date()) {
    return { error: "O prazo precisa ser no futuro. Para encerrar agora, use “Encerrar debate”." };
  }

  await db.update(debates).set({ deadline }).where(eq(debates.id, id));
  // A página já mostra o prazo novo; sem mensagem para não ficar velha depois.
  refresh();
  return {};
}

export async function removeDeadline(formData: FormData) {
  await requireAdmin();
  await db.update(debates).set({ deadline: null }).where(eq(debates.id, debateId(formData)));
  refresh();
}

export async function closeDebate(formData: FormData) {
  await requireAdmin();
  // Só grava se ainda não foi encerrado, para não mudar a data do encerramento.
  await db
    .update(debates)
    // Relógio do banco, o mesmo de created_at e da regra de debate aberto.
    .set({ closedAt: sql`now()` })
    .where(and(eq(debates.id, debateId(formData)), isNull(debates.closedAt)));
  after(notifyClosedDebates);
  refresh();
}

// O apartamento vem do perfil (dentro de castVote); o formulário só manda debate e escolha.
export async function vote(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireApproved();
  const id = debateId(formData);
  try {
    await castVote(user.id, id, String(formData.get("choice") ?? "") as Choice);
  } catch (error) {
    // Debate encerrado no meio do caminho: mostra o motivo e a página já volta encerrada.
    refresh();
    return { error: error instanceof Error ? error.message : "Não foi possível votar." };
  }
  refresh();
  return {};
}

export async function comment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireApproved();
  const id = debateId(formData);
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Escreva o comentário." };
  if (body.length > COMMENT_MAX) {
    return { error: `O comentário pode ter no máximo ${COMMENT_MAX} caracteres.`, values: { body } };
  }
  if (!(await addComment(user.id, id, body))) {
    refresh();
    return { error: "Este debate foi encerrado; não aceita mais comentários.", values: { body } };
  }
  refresh();
  return {};
}

export async function deleteComment(formData: FormData) {
  const user = await requireApproved();
  const id = String(formData.get("commentId") ?? "");
  if (!UUID.test(id)) throw new Error("Pedido inválido.");
  // Sem permissão ou já removido: não faz nada; a página recarregada mostra o estado real.
  await removeComment(id, user);
  refresh();
}

// Chamada pela página do debate ao abrir e quando chegam comentários novos.
export async function markDebateRead(id: string) {
  const user = await requireApproved();
  if (!UUID.test(id)) return;
  await markRead(user.id, id);
}

export async function markAllDebatesRead() {
  const user = await requireApproved();
  await markAllRead(user.id);
  refresh();
}

// Votos e comentários vão junto (cascade).
export async function deleteDebate(formData: FormData) {
  await requireAdmin();
  await db.delete(debates).where(eq(debates.id, debateId(formData)));
  redirect("/");
}
