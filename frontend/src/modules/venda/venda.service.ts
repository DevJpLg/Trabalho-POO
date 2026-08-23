import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { StatusVenda, VendaDTO } from "../../shared/types/api";
import type { InterfaceVendaRepository } from "./venda.repository";

export interface InterfaceVendaService {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
  /** Vendas que ainda aceitam alteração de itens pelo atendente. */
  listarEmAndamento(): Promise<VendaDTO[]>;
  /** Vendas aguardando validação do farmacêutico. */
  listarEmAvaliacao(): Promise<VendaDTO[]>;
}

export class VendaService implements InterfaceVendaService {
  constructor(private readonly repository: InterfaceVendaRepository) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return listarTolerante(() => this.repository.listar(status));
  }

  listarEmAndamento(): Promise<VendaDTO[]> {
    return this.listar("EM_ANDAMENTO");
  }

  listarEmAvaliacao(): Promise<VendaDTO[]> {
    return this.listar("EM_AVALIACAO");
  }
}
