import type InterfaceVendaRepository from "./venda.repository";
import InterfaceItemVendaRepository from "../itemVenda/itemVenda.repository";
import Venda, { StatusVenda } from "./index";
import Usuario from "../usuario";
import InterfaceAutorizacaoService from "../usuario/autorizacao/autorizacao.service";
import InterfaceProdutoService from "../produto/produto.service";
import InterfaceNotificacaoService from "../notificacao/notificacao.service";

export default interface InterfaceVendaService {
  listarVendas(busca: string, usuarioLogado: Usuario): Promise<Venda[] | Error>;
  registrarVenda(usuarioLogado: Usuario, idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null): Promise<boolean | Error>;
  finalizarVenda(usuarioLogado: Usuario, vendaId: number): Promise<void | Error>;
}

export class VendaService implements InterfaceVendaService {
  constructor(
    private readonly repository: InterfaceVendaRepository,
    private readonly itemVendaRepository: InterfaceItemVendaRepository,
    private readonly autorizacaoService: InterfaceAutorizacaoService,
    private readonly produtoService: InterfaceProdutoService,
    private readonly notificacaoService: InterfaceNotificacaoService,
  ) {}


  // ! ========== Lista todas as vendas ==========  //
  public async listarVendas(busca : string = "", usuarioLogado: Usuario): Promise<Venda[] | Error> {
    try {
      if(!(await this.autorizacaoService.usuarioPodeGerenciarVendas(usuarioLogado))) {
        return new Error("Usuário não autorizado");
      }

      const resultado = await this.repository.listarVendas(busca);
      if (resultado === null) {
        return [];
      }

      for (const venda of resultado) {
        await this.associarItensNaVenda(venda);
      }

      return resultado;
    } catch {
      return new Error("Erro ao listar vendas");
    }
  }


  // ! ========== Registrar uma venda (criar venda) ==========  //
  public async registrarVenda(usuarioLogado: Usuario, idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null): Promise<boolean | Error> {
    try {
      if(!(await this.autorizacaoService.usuarioPodeGerenciarVendas(usuarioLogado))) { 
        throw new Error("Usuário não autorizado"); 
      }
      
      if(idAtendente == null && idCaixa == null) { 
        throw new Error("Atendente ou caixa são obrigatórios"); 
      }

      const vendaCriada = Venda.criarVenda(idAtendente, idFarmaceutico, idCaixa);
      if (vendaCriada instanceof Error) {
        throw vendaCriada;
      }

      const vendaRegistrada = await this.repository.registrarVenda(vendaCriada);
      if (vendaRegistrada instanceof Error) {
        throw vendaRegistrada;
      }

      return vendaRegistrada;
    } catch (error) {
      if(error instanceof Error) {
        return error;
      }
      return new Error("Erro ao registrar venda");
    }
  }


  public async finalizarVenda(usuarioLogado: Usuario, vendaId: number): Promise<void | Error> {
    try {
      if(!(await this.autorizacaoService.usuarioPodeGerenciarVendas(usuarioLogado))) {
        return new Error("Usuário não autorizado");
      }

      const venda = await this.repository.buscarVendaPorId(vendaId);
      if (venda === null) {
        throw new Error("Venda não encontrada");
      }

      const associacaoItems = await this.associarItensNaVenda(venda);
      if (associacaoItems === null) {
        throw new Error("Erro ao associar itens na venda");
      }

      const finalizacaoVenda = await venda.finalizarVenda(usuarioLogado);
      if (finalizacaoVenda instanceof Error) {
        throw finalizacaoVenda;
      }

      if(venda.getStatus() === StatusVenda.FINALIZADA) {
        const resultadoBaixa = await this.produtoService.realizarBaixa(usuarioLogado, venda.getItens());
        if (resultadoBaixa instanceof Error) {
          throw resultadoBaixa;
        }
      }

      const salvarFinalizacaoVenda = await this.repository.finalizar(venda);
      if (!salvarFinalizacaoVenda) {
        throw new Error("Erro ao salvar finalização da venda");
      }

      if (venda.temItemPrescrito() && venda.getStatus() === StatusVenda.EM_AVALIACAO) {
        const id = venda.getId();
        if (id === null) {
          throw new Error("Venda sem identificador");
        }

        const notificacao = await this.notificacaoService.criarNotificacao(id);
        if (notificacao instanceof Error) {
          throw notificacao;
        }
      }
    } catch (error) {
      if(error instanceof Error) {
        return error;
      }
      return new Error("Erro ao finalizar venda");
    }
  }

  
  // ! ========== Associa os itens reconstruídos pelo repositório de ItemVenda ==========  //
  private async associarItensNaVenda(venda: Venda): Promise<void> {
    const id = venda.getId();
    if (id === null) {
      return;
    }

    const itens = await this.itemVendaRepository.listarItensVenda(id);
    venda.associarItens(itens ?? []);
  }
}
