import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";
import { produtoParaInput } from "./produto.mapper";
import type { InterfaceProdutoRepository } from "./produto.repository";

export interface InterfaceProdutoService {
  listar(busca?: string): Promise<ProdutoDTO[]>;
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  listarValidades(dias?: number): Promise<ProdutoDTO[]>;
  /** Escolhe entre catálogo completo e catálogo vendável conforme o perfil. */
  listarPorPerfil(catalogoCompleto: boolean, busca?: string): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  entrada(id: number, qtd: number): Promise<MessageResponse>;
  /**
   * `PATCH /produtos/:id/baixa` só autoriza ATENDENTE/CAIXA. O botão da tela de
   * produtos é do GERENTE, então a baixa dele segue por `PUT /produtos/:id`.
   */
  baixa(produto: ProdutoDTO, qtd: number): Promise<MessageResponse>;
  alterarValidade(id: number, novaValidade: string): Promise<MessageResponse>;
  bloquear(id: number): Promise<MessageResponse>;
  desbloquear(id: number): Promise<MessageResponse>;
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

  listarValidades(dias?: number): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.listarValidades(dias));
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

  entrada(id: number, qtd: number): Promise<MessageResponse> {
    exigirQuantidade(qtd, "entrada");
    return this.repository.entrada(id, qtd);
  }

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

  alterarValidade(id: number, novaValidade: string): Promise<MessageResponse> {
    const data = new Date(novaValidade);
    if (!novaValidade || Number.isNaN(data.getTime())) {
      throw new Error("Data de validade inválida.");
    }
    return this.repository.alterarValidade(id, novaValidade);
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.repository.bloquear(id);
  }

  desbloquear(id: number): Promise<MessageResponse> {
    return this.repository.desbloquear(id);
  }
}
