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

/** Janela de monitoramento: vencido ou a vencer em até este número de dias corridos. */
export const JANELA_VALIDADE_DIAS = 15;

/** Dias corridos até a data (negativo quando já venceu). Compara só o dia, sem horário. */
export function diasAte(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const iso = String(valor).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;

  const [ano, mes, dia] = iso.split("-").map(Number);
  const alvo = Date.UTC(ano, mes - 1, dia);
  const agora = new Date();
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo - hoje) / (24 * 60 * 60 * 1000));
}

/** Vermelho se vencido, amarelo se vence em até 15 dias, verde se acima de 15. */
export function classeCorValidade(valor: string | null | undefined): string {
  const dias = diasAte(valor);
  if (dias === null) return "text-ink-muted";
  if (dias < 0) return "font-semibold text-brand-red";
  if (dias <= JANELA_VALIDADE_DIAS) return "font-semibold text-amber-ink";
  return "font-semibold text-brand-green";
}
