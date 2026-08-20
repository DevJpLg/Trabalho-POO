import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";

export interface InterfaceProdutoRepository {
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

export class ProdutoRepository implements InterfaceProdutoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(busca = ""): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos", { busca });
  }

  buscarVendaveis(busca = ""): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos/busca", { busca });
  }

  listarValidades(): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos/validades");
  }

  cadastrar(dados: ProdutoInput): Promise<MessageResponse> {
    return this.http.post<MessageResponse>("/produtos", dados);
  }

  editar(id: number, dados: ProdutoInput): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/produtos/${id}`, dados);
  }

  deletar(id: number): Promise<void> {
    return this.http.delete(`/produtos/${id}`);
  }

  async entrada(id: number, qtd: number): Promise<MessageResponse | null> {
    const result = await this.http.patch<MessageResponse | null>(`/produtos/${id}/entrada`, { qtd });
    return result ?? null;
  }

  baixa(id: number, qtd: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/baixa`, { qtd });
  }

  alterarValidade(id: number, data: string): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/validade`, { data });
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/bloquear`);
  }
}
