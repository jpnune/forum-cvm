import { formatDateTime, type DebateSummary } from "@/lib/debates";

// Selo "Aberto"/"Encerrado", com o prazo quando houver.
export function DebateStatus({ debate }: { debate: Pick<DebateSummary, "isOpen" | "deadline"> }) {
  if (!debate.isOpen) {
    return (
      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Encerrado
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-300">
      {debate.deadline ? `Aberto até ${formatDateTime(debate.deadline)}` : "Aberto"}
    </span>
  );
}
