import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-red text-white shadow-sm hover:bg-brand-red-dark hover:shadow-brand focus-visible:ring-brand-red/40",
  secondary:
    "bg-surface text-ink ring-1 ring-line hover:bg-surface-hover hover:ring-ink-muted/40 focus-visible:ring-brand-green/35",
  danger:
    "bg-surface text-brand-red ring-1 ring-brand-red/30 hover:bg-brand-red-soft hover:ring-brand-red/50 focus-visible:ring-brand-red/35",
  ghost:
    "bg-transparent text-ink-muted hover:bg-surface-hover hover:text-ink focus-visible:ring-line",
  success:
    "bg-brand-green text-white shadow-sm hover:bg-brand-green-dark focus-visible:ring-brand-green/40",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type Tone = "neutral" | "success" | "danger" | "warning";

const iconTones: Record<Tone, string> = {
  neutral:
    "bg-surface-muted text-ink hover:bg-surface-hover focus-visible:ring-brand-green/35",
  success:
    "bg-brand-green text-white hover:bg-brand-green-dark focus-visible:ring-brand-green/40",
  danger:
    "bg-brand-red-soft text-brand-red hover:bg-brand-red hover:text-white focus-visible:ring-brand-red/35",
  warning:
    "bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-red/40",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  /** Vira `title` e `aria-label`: a ação precisa continuar legível sem o ícone. */
  label: string;
  tone?: Tone;
  children: ReactNode;
};

/**
 * Ação compacta para linhas de tabela. Uma linha de produto chega a ter seis
 * ações — em pílulas com texto elas quebravam em três fileiras e afogavam o
 * conteúdo da tabela.
 */
export function IconButton({
  label,
  tone = "neutral",
  className = "",
  children,
  onClick,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 ${iconTones[tone]} ${className}`}
      {...props}
      onClick={(evento) => {
        evento.stopPropagation();
        onClick?.(evento);
      }}
    >
      {children}
    </button>
  );
}
