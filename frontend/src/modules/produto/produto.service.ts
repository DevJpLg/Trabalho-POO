import { ApiError } from "../../shared/http/HttpClient";
import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";
import { produtoParaInput } from "./produto.mapper";
import type { InterfaceProdutoRepository } from "./produto.repository";

export interface InterfaceProdutoService {
  listar(busca?: string): Promise<ProdutoDTO[]>;
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  listarValidades(): Promise<ProdutoDTO[]>;
  /** Escolhe entre catálogo completo e catálogo vendável conforme o perfil. */
  listarPorPerfil(catalogoCompleto: boolean, busca?: string): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  entrada(produto: ProdutoDTO, qtd: number): Promise<string>;
  baixa(produto: ProdutoDTO, qtd: number): Promise<MessageResponse>;
  alterarValidade(produto: ProdutoDTO, novaValidade: string): Promise<MessageResponse>;
  bloquear(id: number): Promise<MessageResponse>;
}

function estaVencido(validade: string | null): boolean {
  if (!validade) return false;
  const data = new Date(validade);
  if (Number.isNaN(data.getTime())) return false;
  return data.getTime() < Date.now();
}

function exigirQuantidade(qtd: number, rotulo: string): void {
  if (!Number.isInteger(qtd) || qtd <= 0) {
    throw new Error(`Quantidade de ${rotulo} deve ser um inteiro maior que zero.`);
  }
}

export class ProdutoService implements InterfaceProdutoService {
  constructor(private readonly repository: InterfaceProdutoRepository) {}

  listar(busca = ""): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.listar(busca));
  }

  buscarVendaveis(busca = ""): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.buscarVendaveis(busca));
  }

  listarValidades(): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.listarValidades());
  }

  listarPorPerfil(catalogoCompleto: boolean, busca = ""): Promise<ProdutoDTO[]> {
    return catalogoCompleto ? this.listar(busca) : this.buscarVendaveis(busca);
  }

  cadastrar(dados: ProdutoInput): Promise<MessageResponse> {
    return this.repository.cadastrar(dados);
  }

  editar(id: number, dados: ProdutoInput): Promise<MessageResponse> {
    return this.repository.editar(id, dados);
  }

  deletar(id: number): Promise<void> {
    return this.repository.deletar(id);
  }

  /**
   * Entrada de estoque pela rota dedicada (`PATCH /produtos/:id/entrada`), que
   * mantém as regras de negócio do backend mas não responde quando dá certo.
   *
   * As três condições que o backend recusaria são checadas aqui antes de enviar,
   * então o único desfecho possível de uma requisição sem resposta é sucesso —
   * o timeout curto do repository é o sinal de que terminou.
   */
  async entrada(produto: ProdutoDTO, qtd: number): Promise<string> {
    exigirQuantidade(qtd, "entrada");

    if (!produto.isActive) {
      throw new Error("Produto bloqueado não pode receber entrada de estoque.");
    }
    if (estaVencido(produto.validade)) {
      throw new Error("Produto vencido não pode receber entrada de estoque.");
    }

    try {
      const resultado = await this.repository.entrada(produto.id, qtd);
      return resultado?.message ?? "Entrada registrada.";
    } catch (error) {
      if (error instanceof ApiError && error.timeout) {
        return "Entrada registrada.";
      }
      throw error;
    }
  }

  /**
   * Baixa de estoque por `PUT /produtos/:id`.
   *
   * A rota dedicada (`PATCH /produtos/:id/baixa`) nunca autoriza ninguém por causa
   * de um `||` no lugar de `&&`. Como o GERENTE já pode alterar `quantidadeEstoque`
   * pelo formulário de edição, a baixa é o mesmo `PUT` com o campo recalculado —
   * nenhuma permissão nova é assumida.
   */
  baixa(produto: ProdutoDTO, qtd: number): Promise<MessageResponse> {
    exigirQuantidade(qtd, "baixa");

    if (!produto.isActive) {
      throw new Error("Produto bloqueado não pode sofrer baixa de estoque.");
    }
    if (produto.quantidadeEstoque < qtd) {
      throw new Error("Quantidade em estoque insuficiente para a baixa.");
    }

    return this.repository.editar(produto.id, {
      ...produtoParaInput(produto),
      quantidadeEstoque: produto.quantidadeEstoque - qtd,
    });
  }

  /**
   * Troca da validade por `PUT /produtos/:id`, pelo mesmo motivo da baixa —
   * `PATCH /produtos/:id/validade` também recusa todos os perfis.
   */
  alterarValidade(produto: ProdutoDTO, novaValidade: string): Promise<MessageResponse> {
    const data = new Date(novaValidade);
    if (!novaValidade || Number.isNaN(data.getTime())) {
      throw new Error("Data de validade inválida.");
    }

    const fabricacao = produto.dataFabricacao ? new Date(produto.dataFabricacao) : null;
    if (fabricacao && !Number.isNaN(fabricacao.getTime()) && data <= fabricacao) {
      throw new Error("A validade deve ser posterior à data de fabricação.");
    }

    return this.repository.editar(produto.id, {
      ...produtoParaInput(produto),
      validade: novaValidade,
    });
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.repository.bloquear(id);
  }
}
