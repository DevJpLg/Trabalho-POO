import Prescricao from "./index";
import InterfaceCrmService from "./crm";
import InterfaceVendaService from "../venda";
import InterfacePrescricaoRepository from "./prescricao.repository";

export default interface InterfacePrescricaoService {
    cadastrarPrescricao(numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Promise<boolean | Error>;
    listarPrescricoes(busca: string): Promise<Prescricao[] | Error>;
    listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | Error>;
    buscarPrescricaoPorId(id: number): Promise<Prescricao | Error>;
    buscarPrescricaoPorNumeroPrescricao(numeroPrescricao: string): Promise<Prescricao[] | Error>;
    editarPrescricao(id: number, numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Promise<void | Error>;
    deletarPrescricao(id: number): Promise<void | Error>;
}

export class PerscricaoService implements InterfacePrescricaoService {
  private repository: InterfacePrescricaoRepository;
  private crmService: InterfaceCrmService;
  private vendaService: InterfaceVendaService;

  constructor(repository: InterfacePrescricaoRepository, crmService: InterfaceCrmService, vendaService: InterfaceVendaService) {
    this.repository = repository;
    this.crmService = crmService;
    this.vendaService = vendaService;
  }


  /* ! ========== Cadastrar Prescrição ========== ! */
  public async cadastrarPrescricao(numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Promise<boolean | Error> {
    try {
      const PrescricaoExistente = await this.repository.buscarPrescricaoPorNumeroPrescricao(numeroPrescricao);
      if(PrescricaoExistente && PrescricaoExistente.length > 0) {
        return new Error('Prescricao já cadastrada');
      }

      const prescricao = await Prescricao.criarPrescricao(numeroPrescricao, nomeMedico, numeroCrm, ufCrm, nomePaciente, retencao, dataEmissao, dataValidade, anexo, retida, vendaId);
      if(prescricao instanceof Error) {
        return prescricao;
      }

      if(prescricao.getDataEmissao() > new Date()) {
        return new Error('Data de emissão não pode ser maior que a data atual');
      }

      if(prescricao.getDataValidade() < new Date()) {
        return new Error('Data de validade não pode ser menor que a data atual');
      }

      if(prescricao.getDataEmissao() > prescricao.getDataValidade()) {
        return new Error('Data de emissão não pode ser maior que a data de validade');
      }

      const crmValido = await this.crmService.validarCrm(prescricao.getNumeroCrm(), prescricao.getUfCrm());
      if(crmValido instanceof Error) {
        return crmValido;
      }
      
      const resultado = await this.repository.cadastrarPrescricao(prescricao);
      if(!resultado) {
        return new Error('Erro ao cadastrar prescrição');
      }

      return true;
    } catch (error) {
      return new Error('Erro ao cadastrar prescrição');
    }
  }


  /* ! ========== Listar Prescrições ========== ! */
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


  /* ! ========== Listar Prescrições por Venda ID ========== ! */
  public async listarPrescricoesPorVendaId(vendaId: number): Promise<Prescricao[] | Error> {
    try {
      const vendaExistente = await this.vendaService.buscarVendaPorId(vendaId); //ta com erro pq n foi implementado ainda
      if(!vendaExistente) {
        return new Error('Venda não encontrada');
      }

      const resultado = await this.repository.listarPrescricoesPorVendaId(vendaId);
      if(resultado && resultado.length > 0) {
        return resultado;
      }
      return new Error('Nenhuma prescrição encontrada');
    } catch (error) {
      return new Error('Erro ao listar prescrições');
    }
  }


  /* ! ========== Buscar Prescrição por ID ========== ! */
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


  /* ! ========== Buscar Prescrição por Número de Prescrição ========== ! */
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


  /* ! ========== Editar Prescrição ========== ! */
  public async editarPrescricao(id: number, numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Promise<void | Error> {
    try {
      const PrescricaoExistente = await this.repository.buscarPrescricaoPorId(id);
      if(!PrescricaoExistente) {
        return new Error('Prescricao não encontrada');
      }

      const prescricao = await Prescricao.rebuildPrescricao(id, numeroPrescricao, nomeMedico, numeroCrm, ufCrm, nomePaciente, retencao, dataEmissao, dataValidade, anexo, retida, vendaId);
      if(prescricao instanceof Error) {
        return prescricao;
      }

      const crmValido = await this.crmService.validarCrm(prescricao.getNumeroCrm(), prescricao.getUfCrm());
      if(crmValido instanceof Error) {
        return crmValido;
      }

      if(prescricao.getDataEmissao() > new Date()) {
        return new Error('Data de emissão não pode ser maior que a data atual');
      }

      if(prescricao.getDataValidade() < new Date()) {
        return new Error('Data de validade não pode ser menor que a data atual');
      }

      if(prescricao.getDataEmissao() > prescricao.getDataValidade()) {
        return new Error('Data de emissão não pode ser maior que a data de validade');
      }
      
      return await this.repository.editarPrescricao(prescricao);
    } catch (error) {
      return new Error('Erro ao editar prescrição');
    }
  }


  /* ! ========== Deletar Prescrição ========== ! */
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