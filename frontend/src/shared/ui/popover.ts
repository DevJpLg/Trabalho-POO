import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

export type PosicaoPopover = {
  top: number;
  left: number;
  width: number;
  /** `true` quando não coube abaixo e o painel foi virado para cima. */
  paraCima: boolean;
};

/**
 * Calcula onde desenhar um painel flutuante ancorado a um elemento.
 *
 * Os painéis são renderizados em portal no `<body>` com posição fixa: dentro do
 * fluxo normal eles seriam cortados pelo `overflow` do modal ou da tabela.
 */
export function usePosicaoPopover(
  aberto: boolean,
  ancora: RefObject<HTMLElement | null>,
  alturaEstimada = 280,
): PosicaoPopover | null {
  const [posicao, setPosicao] = useState<PosicaoPopover | null>(null);

  useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      return;
    }

    function recalcular() {
      const elemento = ancora.current;
      if (!elemento) return;

      const caixa = elemento.getBoundingClientRect();
      const espacoAbaixo = window.innerHeight - caixa.bottom;
      const paraCima = espacoAbaixo < alturaEstimada && caixa.top > espacoAbaixo;

      setPosicao({
        top: paraCima ? caixa.top - 8 : caixa.bottom + 8,
        left: caixa.left,
        width: caixa.width,
        paraCima,
      });
    }

    recalcular();
    window.addEventListener("scroll", recalcular, true);
    window.addEventListener("resize", recalcular);
    return () => {
      window.removeEventListener("scroll", recalcular, true);
      window.removeEventListener("resize", recalcular);
    };
  }, [aberto, ancora, alturaEstimada]);

  return posicao;
}

/**
 * Fecha o painel ao clicar fora dele ou pressionar Esc.
 *
 * Os dois casos precisam parar no painel e não seguir para o modal que está
 * atrás: um Esc ou um clique no fundo enquanto a lista está aberta deve apenas
 * recolher a lista, nunca descartar o formulário que o usuário preencheu.
 */
export function useFecharAoSair(
  aberto: boolean,
  fechar: () => void,
  ...refs: RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!aberto) return;

    function engolirProximoClique() {
      document.addEventListener("click", (evento) => evento.stopPropagation(), {
        capture: true,
        once: true,
      });
    }

    function aoApontar(evento: PointerEvent) {
      const alvo = evento.target as Node;
      if (refs.some((ref) => ref.current?.contains(alvo))) return;

      fechar();
      // O fundo do modal é um botão que fecha o diálogo inteiro; aqui ele só
      // pode ter servido para tirar o foco da lista.
      if (alvo instanceof Element && alvo.closest("[data-fundo-modal]")) {
        engolirProximoClique();
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      // Na fase de captura o `stopPropagation` impede que o Esc chegue aos
      // ouvintes de borbulha — inclusive o do modal, registrado no mesmo `document`.
      evento.stopPropagation();
      fechar();
    }

    document.addEventListener("pointerdown", aoApontar, true);
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      document.removeEventListener("pointerdown", aoApontar, true);
      document.removeEventListener("keydown", aoTeclar, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, fechar]);
}

/** Classe compartilhada pelos painéis flutuantes (select e calendário). */
export const painelFlutuante =
  "z-[60] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-pop ring-1 ring-line animate-surgir";
