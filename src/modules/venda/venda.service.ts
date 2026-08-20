import type InterfaceVendaRepository from "./venda.repository";
import Venda from "./index";

export class VendaService {
  constructor(private readonly repository: InterfaceVendaRepository) {}

  public listarVendas(busca = ""): Promise<Venda[] | Error> {
    return this.repository.listarVendas(busca);
  }
}
