import type { ReactNode } from "react";
import { Button } from "./Button";
import { IconClose } from "./icons";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/35"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[25px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <Button variant="ghost" type="button" onClick={onClose} aria-label="Fechar modal" className="px-3">
            <IconClose />
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-2">{children}</div>
        {footer ? <div className="flex justify-end gap-2 px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}
