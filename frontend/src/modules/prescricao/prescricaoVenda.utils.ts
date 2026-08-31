import type { ItemVendaDTO } from "../../shared/types/api";

/** Itens do cupom que exigem receita (controlados / prescritos). */
export function linhasExigemPrescricao(linhas: ItemVendaDTO[]): ItemVendaDTO[] {
  return linhas.filter((item) => item.exigeAvaliacao);
}

export function vendaExigePrescricao(linhas: ItemVendaDTO[]): boolean {
  return linhasExigemPrescricao(linhas).length > 0;
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
