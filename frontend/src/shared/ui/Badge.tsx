import type { ReactNode } from "react";

type Tone = "neutral" | "green" | "red" | "amber";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-muted",
  green: "bg-brand-green-soft text-brand-green",
  red: "bg-brand-red-soft text-brand-red",
  amber: "bg-amber-50 text-amber-700",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
