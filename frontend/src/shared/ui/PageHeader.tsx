import type { ReactNode } from "react";
import { IconAlert, IconCheck, IconClose, IconInfo } from "./icons";

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
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : (
        <span />
      )}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

type AlertTone = "error" | "success" | "info";

const alertStyles: Record<AlertTone, string> = {
  error: "bg-brand-red-soft text-brand-red ring-brand-red/20",
  success: "bg-brand-green-soft text-brand-green ring-brand-green/20",
  info: "bg-surface text-ink-muted ring-line",
};

const alertIcons: Record<AlertTone, ReactNode> = {
  error: <IconAlert size={18} />,
  success: <IconCheck size={18} />,
  info: <IconInfo size={18} />,
};

export function Alert({
  tone = "error",
  children,
  onClose,
}: {
  tone?: AlertTone;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ring-inset animate-surgir ${alertStyles[tone]}`}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{alertIcons[tone]}</span>
      <span className="min-w-0 flex-1 leading-relaxed">{children}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dispensar aviso"
          className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1 opacity-60 transition hover:opacity-100"
        >
          <IconClose size={16} />
        </button>
      ) : null}
    </div>
  );
}

/** Bloco cinza pulsante usado enquanto os dados não chegam. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-line animate-pulsar ${className}`} />;
}

/**
 * Esqueleto no formato de tabela. Ocupa o mesmo espaço da lista final, então a
 * tela não "pula" quando os dados chegam.
 */
export function LoadingState({
  label = "Carregando...",
  linhas = 5,
}: {
  label?: string;
  linhas?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[25px] bg-surface shadow-card ring-1 ring-line/60">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="flex items-center gap-4 border-b border-line px-6 py-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="ml-auto h-3 w-20" />
      </div>
      {Array.from({ length: linhas }).map((_, indice) => (
        <div key={indice} className="flex items-center gap-4 border-b border-line/60 px-6 py-5">
          <Skeleton className="size-9 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Estado vazio: ícone, uma frase do que aconteceu e, quando faz sentido, a saída. */
export function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-[25px] bg-surface px-6 py-16 text-center shadow-card ring-1 ring-line/60">
      {icone ? (
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-muted">
          {icone}
        </div>
      ) : null}
      <p className="text-base font-semibold text-ink">{titulo}</p>
      {descricao ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
          {descricao}
        </p>
      ) : null}
      {acao ? <div className="mt-5 flex justify-center">{acao}</div> : null}
    </div>
  );
}
