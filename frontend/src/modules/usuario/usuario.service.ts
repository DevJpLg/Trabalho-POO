import type { MessageResponse, UsuarioDTO, UsuarioInput } from "../../shared/types/api";
import type { InterfaceUsuarioRepository } from "./usuario.repository";

export interface InterfaceUsuarioService {
  listar(busca?: string): Promise<UsuarioDTO[]>;
  cadastrar(dados: UsuarioInput): Promise<MessageResponse>;
  editar(id: number, dados: UsuarioInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
}

export class UsuarioService implements InterfaceUsuarioService {
  constructor(private readonly repository: InterfaceUsuarioRepository) {}

  listar(busca = ""): Promise<UsuarioDTO[]> {
    return this.repository.listar(busca);
  }

  cadastrar(dados: UsuarioInput): Promise<MessageResponse> {
    return this.repository.cadastrar(dados);
  }

  editar(id: number, dados: UsuarioInput): Promise<MessageResponse> {
    return this.repository.editar(id, dados);
  }

  deletar(id: number): Promise<void> {
    return this.repository.deletar(id);
  }
}
