import type { ReactNode } from "react";

type Tone = "neutral" | "green" | "red" | "amber";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-muted ring-line",
  green: "bg-brand-green-soft text-brand-green ring-brand-green/20",
  red: "bg-brand-red-soft text-brand-red ring-brand-red/20",
  amber: "bg-amber-soft text-amber-ink ring-amber-ink/20",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-muted",
  green: "bg-brand-green",
  red: "bg-brand-red",
  amber: "bg-amber-ink",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  /** Bolinha à esquerda, para status que se lê de relance numa coluna. */
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {dot ? <span className={`size-1.5 rounded-full ${dots[tone]}`} /> : null}
      {children}
    </span>
  );
}
