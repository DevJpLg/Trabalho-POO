import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { ItemVendaDTO, MessageResponse, TotalVendaDTO } from "../../shared/types/api";

/**
 * Acesso HTTP ao módulo ItemVenda da API.
 *
 * Listar/alterar itens exige ATENDENTE ou CAIXA; aprovar/recusar exige
 * FARMACEUTICO. A rota `PATCH /itens-venda/venda/:id/avaliar` não é usada porque
 * o controller lista os itens antes de avaliar — precisaria dos dois perfis ao
 * mesmo tempo e recusa qualquer usuário (ver ERROS_BACKEND.md).
 */
export interface InterfaceItemVendaRepository {
  listar(vendaId: number, busca?: string): Promise<ItemVendaDTO[]>;
  buscarPorId(vendaId: number, id: number): Promise<ItemVendaDTO>;
  adicionar(
    vendaId: number,
    produtoId: number,
    quantidade: number,
  ): Promise<MessageResponse & { id?: number }>;
  atualizarQuantidade(vendaId: number, id: number, quantidade: number): Promise<MessageResponse>;
  remover(vendaId: number, id: number): Promise<void>;
  calcularTotal(vendaId: number): Promise<TotalVendaDTO>;
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

  calcularTotal(vendaId: number): Promise<TotalVendaDTO> {
    return this.http.get(`/itens-venda/venda/${vendaId}/total`);
  }

  aprovarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/item/${id}/aprovar`);
  }

  recusarItem(vendaId: number, id: number): Promise<MessageResponse> {
    return this.http.patch(`/itens-venda/venda/${vendaId}/item/${id}/recusar`);
  }
}
