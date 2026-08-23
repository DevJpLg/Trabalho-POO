import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";

/**
 * Acesso HTTP ao módulo Produto da API.
 *
 * `PATCH /produtos/:id/baixa` e `PATCH /produtos/:id/validade` não aparecem aqui:
 * a checagem de perfil nesses dois métodos usa `||` onde deveria usar `&&`, então
 * a condição é sempre verdadeira e nenhum perfil é autorizado. As duas operações
 * são feitas por `PUT /produtos/:id` no `produto.service` (ver ERROS_BACKEND.md).
 */
export interface InterfaceProdutoRepository {
  /** `GET /produtos` — catálogo completo. Só o GERENTE é autorizado. */
  listar(busca?: string): Promise<ProdutoDTO[]>;
  /** `GET /produtos/busca` — só itens vendáveis (ativo, com estoque, na validade). Liberado para todos. */
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  /** `GET /produtos/validades` — vencendo em até 30 dias. Só o FARMACEUTICO é autorizado. */
  listarValidades(): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  entrada(id: number, qtd: number): Promise<MessageResponse | null>;
  /** `PATCH /produtos/:id/bloquear` — alterna `isActive`. Só o FARMACEUTICO é autorizado. */
  bloquear(id: number): Promise<MessageResponse>;
}

/**
 * O happy path de `PATCH /produtos/:id/entrada` não envia resposta nenhuma
 * (o controller só responde no caminho de erro), então a conexão fica aberta.
 *
 * Damos um tempo curto e tratamos o estouro como sucesso. É seguro porque o
 * `produto.service` replica antes as duas únicas condições que gerariam 400
 * (produto bloqueado e produto vencido) e a tela recarrega a lista em seguida,
 * mostrando o estoque real vindo do banco.
 */
const TIMEOUT_ENTRADA_MS = 1_500;

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
    const resultado = await this.http.patch<MessageResponse | null>(
      `/produtos/${id}/entrada`,
      { qtd },
      { timeoutMs: TIMEOUT_ENTRADA_MS },
    );
    return resultado ?? null;
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/produtos/${id}/bloquear`);
  }
}
