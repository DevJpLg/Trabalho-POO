import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { StatusVenda, VendaDTO } from "../../shared/types/api";

/**
 * Acesso HTTP ao módulo Venda da API.
 *
 * Hoje só `GET /vendas` está implementado — iniciar, buscar por id, finalizar,
 * cancelar e mexer nos itens pela rota de venda respondem 501. Por isso o
 * frontend não expõe nenhuma dessas ações (ver ERROS_BACKEND.md).
 */
export interface InterfaceVendaRepository {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
}

export class VendaRepository implements InterfaceVendaRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return this.http.get<VendaDTO[]>("/vendas", status ? { status } : undefined);
  }
}
