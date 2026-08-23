import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  padded?: boolean;
  /** Realça a borda no hover. Use só quando o cartão inteiro for clicável. */
  interativo?: boolean;
};

export function Card({
  children,
  className = "",
  padded = true,
  interativo = false,
  ...props
}: Props) {
  return (
    <section
      className={`min-w-0 rounded-[25px] bg-surface shadow-card ring-1 ring-line/60 transition-shadow ${
        interativo ? "hover:ring-brand-green/30" : ""
      } ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  children,
  className = "mb-5",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-lg font-semibold tracking-tight text-ink ${className}`}>{children}</h2>
  );
}

/** Cabeçalho de cartão com título à esquerda e ação/legenda à direita. */
export function CardHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{titulo}</h2>
        {descricao ? <p className="mt-1 text-sm text-ink-muted">{descricao}</p> : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}
