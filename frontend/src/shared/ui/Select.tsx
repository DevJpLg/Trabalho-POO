import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown } from "./icons";
import { painelFlutuante, useFecharAoSair, usePosicaoPopover } from "./popover";

export type OpcaoSelect = {
  value: string;
  label: string;
  /** Linha secundária, menor, abaixo do rótulo. */
  detalhe?: string;
};

type Props = {
  label?: string;
  error?: string;
  options: OpcaoSelect[];
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

/**
 * Campo de escolha com lista própria.
 *
 * O `<select>` nativo não deixa estilizar as opções (o navegador desenha a
 * lista), então aqui a lista é um painel próprio: mesma tipografia, mesmos
 * cantos e o item escolhido marcado. O painel vai para um portal no `<body>`
 * com posição fixa, senão o `overflow` do modal ou da tabela o cortaria.
 */
export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  id,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(0);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const posicao = usePosicaoPopover(aberto, gatilhoRef);
  const fechar = useCallback(() => setAberto(false), []);
  useFecharAoSair(aberto, fechar, gatilhoRef, painelRef);

  const indiceSelecionado = options.findIndex((opcao) => opcao.value === value);
  const selecionada = indiceSelecionado >= 0 ? options[indiceSelecionado] : null;

  useEffect(() => {
    if (aberto) setDestacado(indiceSelecionado >= 0 ? indiceSelecionado : 0);
  }, [aberto, indiceSelecionado]);

  // Mantém a opção em foco visível quando se navega pelo teclado.
  useEffect(() => {
    if (!aberto) return;
    painelRef.current
      ?.querySelector(`[data-indice="${destacado}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [aberto, destacado]);

  function escolher(indice: number) {
    const opcao = options[indice];
    if (!opcao) return;
    onChange(opcao.value);
    setAberto(false);
    gatilhoRef.current?.focus();
  }

  function aoTeclar(evento: React.KeyboardEvent) {
    if (disabled) return;

    if (!aberto) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(evento.key)) {
        evento.preventDefault();
        setAberto(true);
      }
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setDestacado((atual) => Math.min(atual + 1, options.length - 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestacado((atual) => Math.max(atual - 1, 0));
    } else if (evento.key === "Home") {
      evento.preventDefault();
      setDestacado(0);
    } else if (evento.key === "End") {
      evento.preventDefault();
      setDestacado(options.length - 1);
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      escolher(destacado);
    } else if (evento.key === "Tab") {
      setAberto(false);
    }
  }

  return (
    <div className="block space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
          {label}
        </label>
      ) : null}

      <button
        id={id}
        ref={gatilhoRef}
        type="button"
        role="combobox"
        aria-expanded={aberto}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        onKeyDown={aoTeclar}
        className={`flex w-full items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-left text-sm text-ink outline-none ring-1 transition-all duration-150 hover:ring-ink-muted/35 focus-visible:ring-2 focus-visible:ring-brand-green/45 disabled:cursor-not-allowed disabled:opacity-60 ${
          aberto ? "bg-surface ring-2 ring-brand-green/45" : "ring-line"
        } ${error ? "ring-brand-red/50" : ""}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selecionada ? "" : "text-ink-muted"}`}>
          {selecionada ? selecionada.label : placeholder}
        </span>
        <IconChevronDown
          size={16}
          className={`shrink-0 text-ink-muted transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {error ? <span className="text-xs font-medium text-brand-red">{error}</span> : null}

      {aberto && posicao
        ? createPortal(
            <div
              ref={painelRef}
              role="listbox"
              className={painelFlutuante}
              style={{
                position: "fixed",
                top: posicao.paraCima ? undefined : posicao.top,
                bottom: posicao.paraCima ? window.innerHeight - posicao.top : undefined,
                left: posicao.left,
                width: posicao.width,
                maxHeight: Math.min(264, posicao.maxHeight),
                overflowY: "auto",
              }}
            >
              {options.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">Nenhuma opção.</p>
              ) : (
                options.map((opcao, indice) => {
                  const escolhida = opcao.value === value;
                  return (
                    <button
                      key={`${opcao.value}-${indice}`}
                      type="button"
                      role="option"
                      aria-selected={escolhida}
                      data-indice={indice}
                      onMouseEnter={() => setDestacado(indice)}
                      onClick={() => escolher(indice)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        escolhida
                          ? "bg-brand-green-soft font-semibold text-brand-green"
                          : destacado === indice
                            ? "bg-surface-hover text-ink"
                            : "text-ink"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opcao.label}</span>
                        {opcao.detalhe ? (
                          <span className="mt-0.5 block truncate text-xs font-normal text-ink-muted">
                            {opcao.detalhe}
                          </span>
                        ) : null}
                      </span>
                      {escolhida ? <IconCheck size={16} className="shrink-0" /> : null}
                    </button>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
