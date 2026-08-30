import Venda, { StatusVenda } from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceVendaRepository {
  registrarVenda(venda: Venda): Promise<boolean | Error>;
  listarVendas(busca: string): Promise<Venda[] | null>;
  finalizar(venda: Venda): Promise<boolean>;
  cancelar(venda: Venda): Promise<boolean>;
  buscarVendaPorId(id: number): Promise<Venda | null>;
}

export class VendaRepository implements InterfaceVendaRepository {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }


  /* ! ========== Registrar Venda ========== */
  public async registrarVenda(venda: Venda): Promise<boolean | Error> {
    const id = venda.getId();
    const idAtendente = venda.getIdAtendente();
    const idCaixa = venda.getIdCaixa();
    if (id === null || (idAtendente === null && idCaixa === null)) {
      return new Error("Atendente ou caixa são obrigatórios");
    }

    const resultado = await this.prisma.venda.create({
      data: {
        id: id,
        dataHora: venda.getDataHora(),
        status: venda.getStatus(),
        atendenteId: idAtendente,
        farmaceuticoId: null,
        caixaId: idCaixa,
      },
    });
    return resultado ? true : false;
  }


  /* ! ========== Listar Vendas ========== */
  public async listarVendas(busca: string): Promise<Venda[] | null> {
    let resultado;
    if (busca === "") {
      resultado = await this.prisma.venda.findMany({
        orderBy: { dataHora: "desc" },
      });
    } else {
      resultado = await this.prisma.venda.findMany({
        where: {
          OR: [
            { atendente: { nome: { contains: busca } } },
            { farmaceutico: { nome: { contains: busca } } },
            { caixa: { nome: { contains: busca } } },
            { dataHora: { gte: new Date(busca) } },
          ],
        },
        orderBy: { dataHora: "desc" },
      });
    }

    if (resultado.length > 0) {
      return resultado.map((row) => Venda.rebuildVenda(row.id, row.dataHora, row.status as StatusVenda, row.atendenteId, row.farmaceuticoId, row.caixaId));
    }
    return null;
  }


  /* ! ========== Finalizar Venda ========== */
  public async finalizar(venda: Venda): Promise<boolean> {
    const id = venda.getId();
    if (id === null) {
      return false;
    }

    const resultado = await this.prisma.venda.update({
      where: { id: id },
      data: {
        status: venda.getStatus(),
        farmaceuticoId: venda.getIdFarmaceutico(),
        caixaId: venda.getIdCaixa(),
        atendenteId: venda.getIdAtendente(),
      },
    });
    return resultado ? true : false;
  }


  /* ! ========== Cancelar Venda ========== */
  public async cancelar(venda: Venda): Promise<boolean> {
    const id = venda.getId();
    if (id === null) {
      return false;
    }

    const resultado = await this.prisma.venda.update({
      where: { id: id },
      data: {
        status: venda.getStatus(),
        farmaceuticoId: venda.getIdFarmaceutico(),
        caixaId: venda.getIdCaixa(),
        atendenteId: venda.getIdAtendente(),
      },
    });
    return resultado ? true : false;
  }


  /* ! ========== Buscar Venda por ID ========== */
  public async buscarVendaPorId(id: number): Promise<Venda | null> {
    const resultado = await this.prisma.venda.findUnique({
      where: { id: id },
    });
    if (resultado === null) {
      return null;
    }
    return Venda.rebuildVenda(resultado.id, resultado.dataHora, resultado.status as StatusVenda, resultado.atendenteId, resultado.farmaceuticoId, resultado.caixaId);
  }

}
