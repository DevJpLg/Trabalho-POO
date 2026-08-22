import { isListaVazia, listarTolerante } from "../../shared/http/getErrorMessage";
import type { ItemVendaDTO, MessageResponse } from "../../shared/types/api";
import type { InterfaceItemVendaRepository } from "./itemVenda.repository";

export type ResumoVenda = {
  itens: ItemVendaDTO[];
  total: number;
  /** Itens controlados/prescritos ainda sem aval do farmacêutico. */
  pendentes: number;
};

export interface InterfaceItemVendaService {
  listar(vendaId: number, busca?: string): Promise<ItemVendaDTO[]>;
  buscarPorId(vendaId: number, id: number): Promise<ItemVendaDTO>;
  adicionar(
    vendaId: number,
    produtoId: number,
    quantidade: number,
  ): Promise<MessageResponse & { id?: number }>;
  atualizarQuantidade(vendaId: number, id: number, quantidade: number): Promise<MessageResponse>;
  remover(vendaId: number, id: number): Promise<void>;
  calcularTotal(vendaId: number): Promise<number>;
  /** Itens + total + pendências em uma única chamada, para a tela de atendimento. */
  carregarResumo(vendaId: number, busca?: string): Promise<ResumoVenda>;
  aprovarItem(vendaId: number, id: number): Promise<MessageResponse>;
  recusarItem(vendaId: number, id: number): Promise<MessageResponse>;
}

export class ItemVendaService implements InterfaceItemVendaService {
  constructor(private readonly repository: InterfaceItemVendaRepository) {}

  listar(vendaId: number, busca = ""): Promise<ItemVendaDTO[]> {
    return listarTolerante(() => this.repository.listar(vendaId, busca));
  }

  buscarPorId(vendaId: number, id: number): Promise<ItemVendaDTO> {
    return this.repository.buscarPorId(vendaId, id);
  }

  adicionar(
    vendaId: number,
    produtoId: number,
    quantidade: number,
  ): Promise<MessageResponse & { id?: number }> {
    return this.repository.adicionar(vendaId, produtoId, quantidade);
  }

  atualizarQuantidade(vendaId: number, id: number, quantidade: number): Promise<MessageResponse> {
    return this.repository.atualizarQuantidade(vendaId, id, quantidade);
  }

  remover(vendaId: number, id: number): Promise<void> {
    return this.repository.remover(vendaId, id);
  }

  /** Venda sem itens devolve 400 no backend; para a UI isso é simplesmente zero. */
  async calcularTotal(vendaId: number): Promise<number> {
    try {
      const resposta = await this.repository.calcularTotal(vendaId);
      return Number(resposta?.total ?? 0);
    } catch (error) {
      if (isListaVazia(error)) return 0;
      throw error;
    }
  }

  async carregarResumo(vendaId: number, busca = ""): Promise<ResumoVenda> {
    const [itens, total] = await Promise.all([
      this.listar(vendaId, busca),
      this.calcularTotal(vendaId),
    ]);

    return {
      itens,
      total,
      pendentes: itens.filter((item) => item.exigeAvaliacao && !item.aprovadoFarmaceutico).length,
    };
  }

  aprovarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.repository.aprovarItem(vendaId, id);
  }

  recusarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.repository.recusarItem(vendaId, id);
  }
}
