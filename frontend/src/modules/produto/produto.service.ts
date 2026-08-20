import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";
import type { InterfaceProdutoRepository } from "./produto.repository";

export interface InterfaceProdutoService {
  listar(busca?: string): Promise<ProdutoDTO[]>;
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  listarValidades(): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  entrada(id: number, qtd: number): Promise<MessageResponse | null>;
  baixa(id: number, qtd: number): Promise<MessageResponse>;
  alterarValidade(id: number, data: string): Promise<MessageResponse>;
  bloquear(id: number): Promise<MessageResponse>;
}

export class ProdutoService implements InterfaceProdutoService {
  constructor(private readonly repository: InterfaceProdutoRepository) {}

  listar(busca = ""): Promise<ProdutoDTO[]> {
    return this.repository.listar(busca);
  }

  buscarVendaveis(busca = ""): Promise<ProdutoDTO[]> {
    return this.repository.buscarVendaveis(busca);
  }

  listarValidades(): Promise<ProdutoDTO[]> {
    return this.repository.listarValidades();
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

  entrada(id: number, qtd: number): Promise<MessageResponse | null> {
    return this.repository.entrada(id, qtd);
  }

  baixa(id: number, qtd: number): Promise<MessageResponse> {
    return this.repository.baixa(id, qtd);
  }

  alterarValidade(id: number, data: string): Promise<MessageResponse> {
    return this.repository.alterarValidade(id, data);
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.repository.bloquear(id);
  }
}
