import type { ReactNode } from "react";

export function PageHeader({
  description,
  actions,
}: {
  description?: string;
  actions?: ReactNode;
}) {
  if (!description && !actions) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {description ? <p className="max-w-2xl text-sm text-ink-muted">{description}</p> : <span />}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "bg-brand-red-soft text-brand-red",
    success: "bg-brand-green-soft text-brand-green",
    info: "bg-white text-ink-muted",
  }[tone];

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${styles}`} role="alert">
      {children}
    </div>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="rounded-[25px] bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(26,46,37,0.04)]">
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
