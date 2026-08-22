import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, UsuarioDTO, UsuarioInput } from "../../shared/types/api";

/**
 * Acesso HTTP ao módulo Usuário da API.
 *
 * `GET /usuarios` é chamado **sem** o parâmetro `busca` de propósito: o repositório
 * do backend devolve um objeto solto quando a consulta casa com exatamente um
 * usuário, e o controller faz `.map` em cima disso (500). Trazer a lista inteira e
 * filtrar no cliente evita cair nesse caso (ver ERROS_BACKEND.md e `usuario.service`).
 */
export interface InterfaceUsuarioRepository {
  listar(): Promise<UsuarioDTO[]>;
  cadastrar(dados: UsuarioInput): Promise<MessageResponse>;
  editar(id: number, dados: UsuarioInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
}

export class UsuarioRepository implements InterfaceUsuarioRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(): Promise<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>("/usuarios");
  }

  cadastrar(dados: UsuarioInput): Promise<MessageResponse> {
    return this.http.post<MessageResponse>("/usuarios", dados);
  }

  editar(id: number, dados: UsuarioInput): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/usuarios/${id}`, dados);
  }

  deletar(id: number): Promise<void> {
    return this.http.delete(`/usuarios/${id}`);
  }
}
