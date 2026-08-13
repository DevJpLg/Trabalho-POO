import Prescricao from "./index";
import InterfaceCrmService from "./crm";
import InterfacePrescricaoRepository from "./prescricao.repository";

export default interface InterfacePrescricaoService {
    cadastrarPrescricao(prescricao: Prescricao): Promise<boolean | Error>;
    listarPrescricoes(busca: string): Promise<Prescricao[] | Error>;
    listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | Error>;
    buscarPrescricaoPorId(id: number): Promise<Prescricao | Error>;
    buscarPrescricaoPorNumeroPrescricao(numeroPrescricao: string): Promise<Prescricao[] | Error>;
    editarPrescricao(prescricao: Prescricao): Promise<void | Error>;
    deletarPrescricao(id: number): Promise<void | Error>;
}

export class PerscricaoService implements InterfacePrescricaoService {
  private repository: InterfacePrescricaoRepository;
  private crmService: InterfaceCrmService;

  constructor(repository: InterfacePrescricaoRepository, crmService: InterfaceCrmService) {
    this.repository = repository;
    this.crmService = crmService;
  }


  public async cadastrarPrescricao(prescricao: Prescricao): Promise<boolean | Error> {
    try {
      const PrescricaoExistente = await this.repository.buscarPrescricaoPorNumeroPrescricao(prescricao.getNumeroPrescricao());
      if(PrescricaoExistente && PrescricaoExistente.length > 0) {
        return new Error('Prescricao já cadastrada');
      }

      if(prescricao.getDataEmissao() > new Date()) {
        return new Error('Data de emissão não pode ser maior que a data atual');
      }

      const crmValido = await this.crmService.validarCrm(prescricao.getNumeroCrm(), prescricao.getUfCrm());
      if(crmValido instanceof Error) {
        return crmValido;
      }

      return await this.repository.cadastrarPrescricao(prescricao);
    } catch (error) {
      return new Error('Erro ao cadastrar prescrição');
    }
  }


  public async listarPrescricoes(busca: string): Promise<Prescricao[] | Error> {
    try {
      const resultado = await this.repository.listarPrescricoes(busca);
      if(resultado && resultado.length > 0) {
        return resultado;
      }
      return new Error('Nenhuma prescrição encontrada');
    } catch (error) {
      return new Error('Erro ao listar prescrições');
    }
  }


  public async listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | Error> {
    try {

      //Verificar se a venda existe

      const resultado = await this.repository.listarPrescricoesPorVendaId(vendaId);
      if(resultado && resultado.length > 0) {
        return resultado;
      }
      return new Error('Nenhuma prescrição encontrada');
    } catch (error) {
      return new Error('Erro ao listar prescrições');
    }
  }

  public async buscarPrescricaoPorId(id: number): Promise<Prescricao | Error> {
    try {
      const resultado = await this.repository.buscarPrescricaoPorId(id);
      if(resultado) {
        return resultado;
      }
      return new Error('Prescricao não encontrada');
    } catch (error) {
      return new Error('Erro ao buscar prescrição');
    }
  }

  public async buscarPrescricaoPorNumeroPrescricao(numeroPrescricao: string): Promise<Prescricao[] | Error> {
    try {
      const resultado = await this.repository.buscarPrescricaoPorNumeroPrescricao(numeroPrescricao);
      if(resultado && resultado.length > 0) {
        return resultado;
      }
      return new Error('Nenhuma prescrição encontrada');
    } catch (error) {
      return new Error('Erro ao buscar prescrição');
    }
  }

  public async editarPrescricao(prescricao: Prescricao): Promise<void | Error> {
    try {
      const PrescricaoExistente = await this.repository.buscarPrescricaoPorId(prescricao.getId());
      if(!PrescricaoExistente) {
        return new Error('Prescricao não encontrada');
      }

      const crmValido = await this.crmService.validarCrm(prescricao.getNumeroCrm(), prescricao.getUfCrm());
      if(crmValido instanceof Error) {
        return crmValido;
      }

      return await this.repository.editarPrescricao(prescricao);
    } catch (error) {
      return new Error('Erro ao editar prescrição');
    }
  }

  public async deletarPrescricao(id: number): Promise<void | Error> {
    try {
      const PrescricaoExistente = await this.repository.buscarPrescricaoPorId(id);
      if(!PrescricaoExistente) {
        return new Error('Prescricao não encontrada');
      }

      return await this.repository.deletarPrescricao(id);
    } catch (error) {
      return new Error('Erro ao deletar prescrição');
    }
  }
}