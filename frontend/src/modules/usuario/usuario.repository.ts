import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, UsuarioDTO, UsuarioInput } from "../../shared/types/api";

export interface InterfaceUsuarioRepository {
  listar(busca?: string): Promise<UsuarioDTO[]>;
  cadastrar(dados: UsuarioInput): Promise<MessageResponse>;
  editar(id: number, dados: UsuarioInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
}

export class UsuarioRepository implements InterfaceUsuarioRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(busca = ""): Promise<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>("/usuarios", { busca });
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
