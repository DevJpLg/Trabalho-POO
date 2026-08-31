import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, StatusVenda, VendaDTO } from "../../shared/types/api";

export type VendaRegistroInput = {
  idAtendente?: number | null;
  idCaixa?: number | null;
  idFarmaceutico?: number | null;
};

/**
 * Acesso HTTP ao módulo Venda da API.
 *
 * Implementados: `GET /vendas`, `POST /vendas`, `PATCH /vendas/:id/finalizar` e
 * `PATCH /vendas/:id/cancelar`. `GET /vendas/:id` ainda responde 501.
 */
export interface InterfaceVendaRepository {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
  registrar(dados: VendaRegistroInput): Promise<MessageResponse>;
  finalizar(id: number): Promise<MessageResponse>;
  cancelar(id: number): Promise<MessageResponse>;
}

export class VendaRepository implements InterfaceVendaRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return this.http.get<VendaDTO[]>("/vendas", status ? { status } : undefined);
  }

  registrar(dados: VendaRegistroInput): Promise<MessageResponse> {
    return this.http.post<MessageResponse>("/vendas", dados);
  }

  finalizar(id: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/vendas/${id}/finalizar`);
  }

  cancelar(id: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/vendas/${id}/cancelar`);
  }
}
