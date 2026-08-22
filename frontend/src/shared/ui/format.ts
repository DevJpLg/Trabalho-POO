/** Formatadores usados nas telas. Centralizados para manter o mesmo padrão pt-BR. */

export function moeda(valor: number | string | null | undefined): string {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Sempre DD/MM/AAAA, independente do idioma do navegador. */
export function data(valor: string | null | undefined): string {
  if (!valor) return "—";
  const parsed = new Date(valor);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** DD/MM/AAAA HH:MM — sem segundos, que só poluíam a tabela. */
export function dataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const parsed = new Date(valor);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `2026-08-21T00:00:00.000Z` → `2026-08-21`, no formato aceito por `<input type="date">`. */
export function paraInputDate(valor: string | null | undefined): string {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

/** Dias restantes até a data (negativo quando já venceu). */
export function diasAte(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const alvo = new Date(valor);
  if (Number.isNaN(alvo.getTime())) return null;

  const hoje = new Date();
  const umDia = 24 * 60 * 60 * 1000;
  return Math.ceil((alvo.getTime() - hoje.getTime()) / umDia);
}
