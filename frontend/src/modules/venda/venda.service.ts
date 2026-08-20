import type { StatusVenda, VendaDTO } from "../../shared/types/api";
import type { InterfaceVendaRepository } from "./venda.repository";

export interface InterfaceVendaService {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
}

export class VendaService implements InterfaceVendaService {
  constructor(private readonly repository: InterfaceVendaRepository) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return this.repository.listar(status);
  }
}
