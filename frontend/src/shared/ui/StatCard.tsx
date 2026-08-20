import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const tones = {
  green: "bg-brand-green-soft text-brand-green",
  red: "bg-brand-red-soft text-brand-red",
  mint: "bg-[#e8f8f4] text-brand-green-dark",
  rose: "bg-[#fff1f1] text-brand-red",
} as const;

type Props = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: keyof typeof tones;
  to?: string;
};

export function StatCard({ label, value, icon, tone = "green", to }: Props) {
  const content = (
    <>
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-ink-muted">{label}</p>
        <p className="truncate text-[20px] font-semibold leading-tight text-ink">{value}</p>
      </div>
    </>
  );

  const className =
    "flex min-w-0 items-center gap-4 rounded-[25px] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(26,46,37,0.04)]";

  if (to) {
    return (
      <Link to={to} className={`${className} transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(26,46,37,0.08)]`}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
