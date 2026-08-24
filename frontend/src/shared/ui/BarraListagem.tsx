import type { FormEvent, ReactNode } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { IconSearch } from "./icons";

type Props = {
  placeholder?: string;
  busca?: string;
  onBuscaChange?: (valor: string) => void;
  onBuscar?: () => void;
  /** Botão à direita (ex.: Novo produto). */
  acao?: ReactNode;
  mostrarBusca?: boolean;
};

/** Barra branca das telas de listagem: busca cinza + ação à direita. */
export function BarraListagem({
  placeholder = "Buscar...",
  busca = "",
  onBuscaChange,
  onBuscar,
  acao,
  mostrarBusca = true,
}: Props) {
  if (!mostrarBusca && !acao) return null;

  function submeter(event: FormEvent) {
    event.preventDefault();
    onBuscar?.();
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-[15px] bg-surface p-3 shadow-card ring-1 ring-line/60 sm:flex-row sm:items-center">
      {mostrarBusca ? (
        <form
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={submeter}
        >
          <div className="min-w-0 flex-1">
            <Input
              placeholder={placeholder}
              icone={<IconSearch size={17} />}
              className="bg-canvas focus:bg-canvas"
              value={busca}
              onChange={(event) => onBuscaChange?.(event.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="shrink-0">
            Buscar
          </Button>
        </form>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}
