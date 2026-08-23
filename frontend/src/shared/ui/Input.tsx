import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const campo =
  "w-full rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink placeholder:text-ink-muted/80 outline-none ring-1 ring-line transition-all duration-150 hover:ring-ink-muted/35 focus:bg-surface focus:ring-2 focus:ring-brand-green/45 disabled:cursor-not-allowed disabled:opacity-60";

function Rotulo({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-semibold text-ink">{children}</span>;
}

function Erro({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-brand-red">{children}</span>;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  dica?: string;
  /** Ícone decorativo à esquerda do campo. */
  icone?: ReactNode;
};

export function Input({ label, error, dica, icone, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <Rotulo>{label}</Rotulo> : null}
      <span className="relative block">
        {icone ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            {icone}
          </span>
        ) : null}
        <input
          id={inputId}
          className={`${campo} ${icone ? "pl-11" : ""} ${error ? "ring-brand-red/50" : ""} ${className}`}
          {...props}
        />
      </span>
      {error ? <Erro>{error}</Erro> : null}
      {!error && dica ? <span className="text-xs text-ink-muted">{dica}</span> : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, id, className = "", ...props }: TextareaProps) {
  const areaId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <Rotulo>{label}</Rotulo> : null}
      <textarea id={areaId} className={`${campo} min-h-24 resize-y ${className}`} {...props} />
      {error ? <Erro>{error}</Erro> : null}
    </label>
  );
}

/** Caixa de marcação alinhada ao restante dos campos. */
export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
      <input
        type="checkbox"
        className="size-4.5 cursor-pointer rounded-md accent-[var(--color-brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
        {...props}
      />
      {label}
    </label>
  );
}
