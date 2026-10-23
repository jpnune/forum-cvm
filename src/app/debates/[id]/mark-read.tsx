"use client";

import { useEffect } from "react";
import { markDebateRead } from "@/app/debates/actions";

// Marca o debate como lido ao abrir e de novo quando chegam comentários (refresh automático).
// Fica no cliente de propósito: o prefetch de um link não pode contar como leitura.
export function MarkRead({ debateId, commentCount }: { debateId: string; commentCount: number }) {
  useEffect(() => {
    markDebateRead(debateId);
  }, [debateId, commentCount]);
  return null;
}
