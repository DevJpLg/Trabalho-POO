import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-red/30",
  secondary:
    "bg-white text-ink ring-1 ring-line hover:bg-canvas focus-visible:ring-brand-green/25",
  danger:
    "bg-white text-brand-red ring-1 ring-brand-red/30 hover:bg-brand-red-soft focus-visible:ring-brand-red/25",
  ghost:
    "bg-transparent text-ink-muted hover:bg-canvas hover:text-ink focus-visible:ring-line",
  success:
    "bg-brand-green text-white hover:bg-brand-green-dark focus-visible:ring-brand-green/30",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
