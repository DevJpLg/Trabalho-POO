import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const tones = {
  green: "bg-brand-green-soft text-brand-green",
  red: "bg-brand-red-soft text-brand-red",
  mint: "bg-mint-soft text-brand-green-dark",
  rose: "bg-rose-soft text-brand-red",
  amber: "bg-amber-soft text-amber-ink",
} as const;

type Props = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: keyof typeof tones;
  to?: string;
  /** Linha de apoio embaixo do número (ex.: "de 8 cadastrados"). */
  apoio?: string;
};

export function StatCard({ label, value, icon, tone = "green", to, apoio }: Props) {
  const conteudo = (
    <>
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[12px] font-medium uppercase leading-tight tracking-wide text-ink-muted">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[24px] font-bold leading-tight tracking-tight text-ink">
          {value}
        </p>
        {apoio ? <p className="mt-0.5 truncate text-xs text-ink-muted">{apoio}</p> : null}
      </div>
    </>
  );

  const base =
    "group flex min-w-0 items-center gap-4 rounded-[25px] bg-surface px-5 py-4 shadow-card ring-1 ring-line/60";

  if (to) {
    return (
      <Link
        to={to}
        className={`${base} transition-colors duration-150 hover:ring-brand-green/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40`}
      >
        {conteudo}
      </Link>
    );
  }

  return <article className={base}>{conteudo}</article>;
}
