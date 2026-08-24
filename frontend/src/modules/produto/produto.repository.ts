import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";

export interface InterfaceProdutoRepository {
  /** `GET /produtos` — catálogo completo. GERENTE e FARMACEUTICO. */
  listar(busca?: string): Promise<ProdutoDTO[]>;
  /** `GET /produtos/busca` — vendáveis (ativo, com estoque, na validade). Qualquer autenticado. */
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  /** `GET /produtos/validades` — vencendo até `dias` (padrão 30 no backend). Só FARMACEUTICO. */
  listarValidades(dias?: number): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  entrada(id: number, qtd: number): Promise<MessageResponse>;
  baixa(id: number, qtd: number): Promise<MessageResponse>;
  alterarValidade(id: number, data: string): Promise<MessageResponse>;
  bloquear(id: number): Promise<MessageResponse>;
  desbloquear(id: number): Promise<MessageResponse>;
}

export class ProdutoRepository implements InterfaceProdutoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(busca = ""): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos", { busca });
  }

  buscarVendaveis(busca = ""): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos/busca", { busca });
  }

  listarValidades(dias?: number): Promise<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>("/produtos/validades", { dias });
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

  entrada(id: number, qtd: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/entrada`, { qtd });
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

  desbloquear(id: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/desbloquear`);
  }
}
