import type { Choice } from "@/lib/votes";

// Ordem e textos das opções de voto (usado no servidor e no cliente).
export const CHOICES: { value: Choice; label: string }[] = [
  { value: "for", label: "A favor" },
  { value: "against", label: "Contra" },
  { value: "abstain", label: "Abstenção" },
];

export function choiceLabel(choice: Choice) {
  return CHOICES.find((c) => c.value === choice)!.label;
}
