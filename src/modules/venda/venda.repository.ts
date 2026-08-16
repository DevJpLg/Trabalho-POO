import Venda from "./index";

export default interface InterfaceVendaRepository {
  registrarVenda(venda: Venda): Promise<boolean | Error>;
  listarVendas(busca: String): Promise<Venda[] | Error>;
  buscarVendaPorId(id: Number): Promise<Venda | Error>;
  buscarVendasporAtendente(idAtendente: Number): Promise<Venda[] | Error>;
  buscarVendasporFarmaceutico(idFarmaceutico: Number): Promise<Venda[] | Error>;
  buscarVendasporCaixa(idCaixa: Number): Promise<Venda[] | Error>;
  editarVenda(venda: Venda): Promise<boolean | Error>;
  deletarVenda(id: Number): Promise<boolean | Error>;
}