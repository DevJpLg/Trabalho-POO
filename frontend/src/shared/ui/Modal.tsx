import { useEffect, type ReactNode } from "react";
import { IconButton } from "./Button";
import { IconClose } from "./icons";

type Props = {
  open: boolean;
  title: string;
  descricao?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** `lg` para formulários de duas colunas, `xl` para ficha completa. */
  tamanho?: "sm" | "md" | "lg" | "xl";
};

const larguras = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
} as const;

export function Modal({
  open,
  title,
  descricao,
  onClose,
  children,
  footer,
  tamanho = "md",
}: Props) {
  // Esc fecha e o fundo para de rolar enquanto o diálogo está aberto.
  useEffect(() => {
    if (!open) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        data-fundo-modal
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-pop ring-1 ring-line animate-surgir sm:rounded-[25px] ${larguras[tamanho]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h2>
            {descricao ? <p className="mt-1 text-sm text-ink-muted">{descricao}</p> : null}
          </div>
          <IconButton label="Fechar modal" onClick={onClose}>
            <IconClose size={18} />
          </IconButton>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
