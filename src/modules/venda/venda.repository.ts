import Venda, { StatusVenda } from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

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

export class VendaRepository implements InterfaceVendaRepository {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  public async registrarVenda(_venda: Venda): Promise<boolean | Error> {
    return new Error("Não implementado");
  }

  public async listarVendas(_busca: String): Promise<Venda[] | Error> {
    try {
      const resultado = await this.prisma.venda.findMany({
        orderBy: { dataHora: "desc" },
      });

      return resultado.map(
        (row) =>
          new Venda(
            row.id,
            row.dataHora,
            row.status as StatusVenda,
            row.atendenteId,
            row.farmaceuticoId,
            row.caixaId,
          ),
      );
    } catch {
      return new Error("Erro ao listar vendas");
    }
  }

  public async buscarVendaPorId(_id: Number): Promise<Venda | Error> {
    return new Error("Não implementado");
  }

  public async buscarVendasporAtendente(_idAtendente: Number): Promise<Venda[] | Error> {
    return new Error("Não implementado");
  }

  public async buscarVendasporFarmaceutico(_idFarmaceutico: Number): Promise<Venda[] | Error> {
    return new Error("Não implementado");
  }

  public async buscarVendasporCaixa(_idCaixa: Number): Promise<Venda[] | Error> {
    return new Error("Não implementado");
  }

  public async editarVenda(_venda: Venda): Promise<boolean | Error> {
    return new Error("Não implementado");
  }

  public async deletarVenda(_id: Number): Promise<boolean | Error> {
    return new Error("Não implementado");
  }
}