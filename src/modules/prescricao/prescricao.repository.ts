import Prescricao from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfacePrescricaoRepository {
    cadastrarPrescricao(prescricao: Prescricao): Promise<boolean>;
    listarPrescricoes(busca: string): Promise<Prescricao[] | null>;
    listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | null>;
    buscarPrescricaoPorId(id: number): Promise<Prescricao | null>;
    buscarPrescricaoPorNumeroPrescricao(numeroPrescricao: string): Promise<Prescricao[] | null>;
    editarPrescricao(prescricao: Prescricao): Promise<void>;
    deletarPrescricao(id: number): Promise<void>;
}

export class PrescricaoRepository implements InterfacePrescricaoRepository {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }
  

  public async cadastrarPrescricao(prescricao: Prescricao): Promise<boolean> {
    const resultado = await this.prisma.prescricao.create({
      data: {
        numeroPrescricao: prescricao.getNumeroPrescricao(),
        nomeMedico: prescricao.getNomeMedico(),
        numeroCrm: prescricao.getNumeroCrm(),
        ufCrm: prescricao.getUfCrm(),
        nomePaciente: prescricao.getNomePaciente(),
        retencao: prescricao.getRetencao(),
        dataEmissao: prescricao.getDataEmissao(),
        dataValidade: prescricao.getDataValidade(),
        anexo: prescricao.getAnexo(),
        retida: prescricao.getRetida(),
        vendaId: prescricao.getVendaId(),
      }
    });

    return resultado.id ? true : false;
  }


  public async listarPrescricoes(busca: string): Promise<Prescricao[] | null> {
    const resultado = await this.prisma.prescricao.findMany({
      where: {
        OR: [
          { numeroPrescricao: { contains: busca } },
          { nomeMedico: { contains: busca } },
          { numeroCrm: { contains: busca } },
          { nomePaciente: { contains: busca } },
          { dataEmissao: { gte: new Date(busca) } },
          { dataValidade: { lte: new Date(busca) } },
        ]
      }
    });

    if (resultado.length > 0) {
      return resultado.map((prescricao) => new Prescricao(
        prescricao.id,
        prescricao.numeroPrescricao,
        prescricao.nomeMedico,
        prescricao.numeroCrm,
        prescricao.ufCrm,
        prescricao.nomePaciente,
        prescricao.retencao,
        prescricao.dataEmissao,
        prescricao.dataValidade,
        prescricao.anexo || '',
        prescricao.retida,
        prescricao.vendaId,
      ));
    }
    return null;
  }


  public async listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | null> {
    const resultado = await this.prisma.prescricao.findMany({ where: { vendaId } });

    if (resultado.length > 0) {
      return resultado.map((prescricao) => new Prescricao(
        prescricao.id,
        prescricao.numeroPrescricao,
        prescricao.nomeMedico,
        prescricao.numeroCrm,
        prescricao.ufCrm,
        prescricao.nomePaciente,
        prescricao.retencao,
        prescricao.dataEmissao,
        prescricao.dataValidade,
        prescricao.anexo || '',
        prescricao.retida,
        prescricao.vendaId,
      ));
    }

    return null;
  }


  public async buscarPrescricaoPorId(id: number): Promise<Prescricao | null> {
    const resultado = await this.prisma.prescricao.findUnique({ where: { id } });

    if (resultado) {
      return new Prescricao(
        resultado.id,
        resultado.numeroPrescricao,
        resultado.nomeMedico,
        resultado.numeroCrm,
        resultado.ufCrm,
        resultado.nomePaciente,
        resultado.retencao,
        resultado.dataEmissao,
        resultado.dataValidade,
        resultado.anexo || '',
        resultado.retida,
        resultado.vendaId,  
      );
    }
    return null;
  }


  public async buscarPrescricaoPorNumeroPrescricao(numeroPrescricao: string): Promise<Prescricao[] | null> {
    const resultado = await this.prisma.prescricao.findMany({ where: { numeroPrescricao } });

    if (resultado.length > 0) {
      return resultado.map((prescricao) => new Prescricao(
        prescricao.id,
        prescricao.numeroPrescricao,
        prescricao.nomeMedico,
        prescricao.numeroCrm,
        prescricao.ufCrm,
        prescricao.nomePaciente,
        prescricao.retencao,
        prescricao.dataEmissao,
        prescricao.dataValidade,
        prescricao.anexo || '',
        prescricao.retida,
        prescricao.vendaId,
      ));
    }
    return null;
  }


  public async editarPrescricao(prescricao: Prescricao): Promise<void> {
    await this.prisma.prescricao.update({
      where: { id: prescricao.getId() },
      data: {
        numeroPrescricao: prescricao.getNumeroPrescricao(),
        nomeMedico: prescricao.getNomeMedico(),
        numeroCrm: prescricao.getNumeroCrm(),
        ufCrm: prescricao.getUfCrm(),
        nomePaciente: prescricao.getNomePaciente(),
        retencao: prescricao.getRetencao(),
        dataEmissao: prescricao.getDataEmissao(),
        dataValidade: prescricao.getDataValidade(),
        anexo: prescricao.getAnexo(),
        retida: prescricao.getRetida(),
        vendaId: prescricao.getVendaId(),
      }
    });
  }


  public async deletarPrescricao(id: number): Promise<void> {
    await this.prisma.prescricao.delete({ where: { id } });
  }

}