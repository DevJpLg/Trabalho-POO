import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Tema = "claro" | "escuro";

const TEMA_KEY = "fbs_tema";

type TemaContextValue = {
  /** Tema em vigor na tela (já resolvido, nunca "sistema"). */
  tema: Tema;
  /** `true` quando nenhuma escolha foi feita e o tema acompanha o sistema. */
  seguindoSistema: boolean;
  alternar: () => void;
  usarSistema: () => void;
};

const TemaContext = createContext<TemaContextValue | null>(null);

function lerPreferencia(): Tema | null {
  try {
    const valor = localStorage.getItem(TEMA_KEY);
    return valor === "claro" || valor === "escuro" ? valor : null;
  } catch {
    return null;
  }
}

function temaDoSistema(): Tema {
  if (typeof window === "undefined" || !window.matchMedia) return "claro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function aplicarNoDocumento(escolha: Tema | null) {
  const raiz = document.documentElement;
  if (escolha === null) {
    raiz.removeAttribute("data-theme");
  } else {
    raiz.setAttribute("data-theme", escolha === "escuro" ? "dark" : "light");
  }
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [escolha, setEscolha] = useState<Tema | null>(() => lerPreferencia());
  const [doSistema, setDoSistema] = useState<Tema>(() => temaDoSistema());

  // Sem escolha explícita, a tela acompanha o sistema em tempo real.
  useEffect(() => {
    if (!window.matchMedia) return;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = (evento: MediaQueryListEvent) => setDoSistema(evento.matches ? "escuro" : "claro");
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  useEffect(() => {
    aplicarNoDocumento(escolha);
    try {
      if (escolha === null) localStorage.removeItem(TEMA_KEY);
      else localStorage.setItem(TEMA_KEY, escolha);
    } catch {
      /* armazenamento indisponível: a escolha vale só nesta sessão */
    }
  }, [escolha]);

  const tema = escolha ?? doSistema;

  const alternar = useCallback(() => {
    setEscolha((atual) => ((atual ?? temaDoSistema()) === "escuro" ? "claro" : "escuro"));
  }, []);

  const usarSistema = useCallback(() => setEscolha(null), []);

  const value = useMemo(
    () => ({ tema, seguindoSistema: escolha === null, alternar, usarSistema }),
    [tema, escolha, alternar, usarSistema],
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaContextValue {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error("useTema deve ser usado dentro de TemaProvider");
  }
  return ctx;
}
