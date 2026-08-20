import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { StatusVenda, VendaDTO } from "../../shared/types/api";

export interface InterfaceVendaRepository {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
}

export class VendaRepository implements InterfaceVendaRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return this.http.get<VendaDTO[]>("/vendas", status ? { status } : undefined);
  }
}
