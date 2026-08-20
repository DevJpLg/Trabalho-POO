import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { ItemVendaDTO, MessageResponse } from "../../shared/types/api";

export interface InterfaceItemVendaRepository {
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

export class ItemVendaRepository implements InterfaceItemVendaRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(vendaId: number, busca = ""): Promise<ItemVendaDTO[]> {
    return this.http.get<ItemVendaDTO[]>(`/itens-venda/venda/${vendaId}`, { busca });
  }

  buscarPorId(vendaId: number, id: number): Promise<ItemVendaDTO> {
    return this.http.get<ItemVendaDTO>(`/itens-venda/venda/${vendaId}/item/${id}`);
  }

  adicionar(
    vendaId: number,
    produtoId: number,
    quantidade: number,
  ): Promise<MessageResponse & { id?: number }> {
    return this.http.post(`/itens-venda/venda/${vendaId}`, { produtoId, quantidade });
  }

  atualizarQuantidade(vendaId: number, id: number, quantidade: number): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/item/${id}`, { quantidade });
  }

  remover(vendaId: number, id: number): Promise<void> {
    return this.http.delete(`/itens-venda/venda/${vendaId}/item/${id}`);
  }

  calcularTotal(vendaId: number): Promise<{ vendaId: number; total: number }> {
    return this.http.get(`/itens-venda/venda/${vendaId}/total`);
  }

  avaliarVenda(vendaId: number, aprovado: boolean): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/avaliar`, { aprovado });
  }

  aprovarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/item/${id}/aprovar`);
  }

  recusarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/item/${id}/recusar`);
  }
}
