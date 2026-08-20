import { createContext, useContext, useEffect } from "react";

export const PageTitleContext = createContext<(title: string) => void>(() => {});

export function usePageTitle(title: string) {
  const setTitle = useContext(PageTitleContext);

  useEffect(() => {
    setTitle(title);
    document.title = `${title} · Farmácia Bairro Saúde`;
    return () => {
      document.title = "Farmácia Bairro Saúde";
    };
  }, [title, setTitle]);
}
