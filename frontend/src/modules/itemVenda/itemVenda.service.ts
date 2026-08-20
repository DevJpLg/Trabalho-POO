import type { ItemVendaDTO, MessageResponse } from "../../shared/types/api";
import type { InterfaceItemVendaRepository } from "./itemVenda.repository";

export interface InterfaceItemVendaService {
  listar(vendaId: number, busca?: string): Promise<ItemVendaDTO[]>;
  buscarPorId(vendaId: number, id: number): Promise<ItemVendaDTO>;
  adicionar(vendaId: number, produtoId: number, quantidade: number): Promise<MessageResponse & { id?: number }>;
  atualizarQuantidade(vendaId: number, id: number, quantidade: number): Promise<MessageResponse>;
  remover(vendaId: number, id: number): Promise<void>;
  calcularTotal(vendaId: number): Promise<{ vendaId: number; total: number }>;
  avaliarVenda(vendaId: number, aprovado: boolean): Promise<MessageResponse>;
  aprovarItem(vendaId: number, id: number): Promise<MessageResponse>;
  recusarItem(vendaId: number, id: number): Promise<MessageResponse>;
}

export class ItemVendaService implements InterfaceItemVendaService {
  constructor(private readonly repository: InterfaceItemVendaRepository) {}

  listar(vendaId: number, busca = ""): Promise<ItemVendaDTO[]> {
    return this.repository.listar(vendaId, busca);
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

  calcularTotal(vendaId: number): Promise<{ vendaId: number; total: number }> {
    return this.repository.calcularTotal(vendaId);
  }

  avaliarVenda(vendaId: number, aprovado: boolean): Promise<MessageResponse> {
    return this.repository.avaliarVenda(vendaId, aprovado);
  }

  aprovarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.repository.aprovarItem(vendaId, id);
  }

  recusarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.repository.recusarItem(vendaId, id);
  }
}
