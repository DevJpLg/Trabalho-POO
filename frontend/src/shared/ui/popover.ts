import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

export type PosicaoPopover = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  /** `true` quando não coube abaixo e o painel foi virado para cima. */
  paraCima: boolean;
};

export type OpcoesPosicaoPopover = {
  /** Largura fixa do painel. Sem isso, ele acompanha a âncora. */
  larguraMaxima?: number;
  /** `fim` alinha o painel à direita da âncora (ex.: calendário no ícone). */
  alinhar?: "inicio" | "fim";
};

const MARGEM = 8;

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
  opcoes: OpcoesPosicaoPopover = {},
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
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      const larguraAlvo = opcoes.larguraMaxima ?? caixa.width;
      const width = Math.min(Math.max(larguraAlvo, 0), viewportW - MARGEM * 2);

      let left = opcoes.alinhar === "fim" ? caixa.right - width : caixa.left;
      left = Math.min(Math.max(MARGEM, left), viewportW - width - MARGEM);

      const espacoAbaixo = viewportH - caixa.bottom - MARGEM;
      const espacoAcima = caixa.top - MARGEM;
      const paraCima = espacoAbaixo < alturaEstimada && espacoAcima > espacoAbaixo;

      setPosicao({
        top: paraCima ? caixa.top - MARGEM : caixa.bottom + MARGEM,
        left,
        width,
        maxHeight: Math.max(160, paraCima ? espacoAcima : espacoAbaixo),
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
  }, [aberto, ancora, alturaEstimada, opcoes.larguraMaxima, opcoes.alinhar]);

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
