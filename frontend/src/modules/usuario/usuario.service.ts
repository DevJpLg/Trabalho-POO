import { listarTolerante } from "../../shared/http/getErrorMessage";
import { perfilLabel, type MessageResponse, type UsuarioDTO, type UsuarioInput } from "../../shared/types/api";
import type { InterfaceUsuarioRepository } from "./usuario.repository";

export interface InterfaceUsuarioService {
  listar(busca?: string): Promise<UsuarioDTO[]>;
  cadastrar(dados: UsuarioInput): Promise<MessageResponse>;
  editar(id: number, dados: UsuarioInput): Promise<MessageResponse>;
  deletar(id: number): Promise<void>;
  alternarStatus(id: number, isActive: boolean): Promise<MessageResponse>;
}

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function combina(usuario: UsuarioDTO, termo: string): boolean {
  return [usuario.nome, usuario.email, perfilLabel[usuario.perfil], usuario.perfil]
    .map(normalizar)
    .join(" ")
    .includes(termo);
}

/** O repositório do backend devolve um objeto solto quando há um único resultado. */
function normalizarLista(resultado: UsuarioDTO[] | UsuarioDTO): UsuarioDTO[] {
  if (Array.isArray(resultado)) return resultado;
  return resultado ? [resultado] : [];
}

export class UsuarioService implements InterfaceUsuarioService {
  constructor(private readonly repository: InterfaceUsuarioRepository) {}

  /**
   * Busca por texto é feita no cliente: mandar `busca` para a API faz o backend
   * quebrar (500) sempre que o termo casar com exatamente um usuário.
   */
  async listar(busca = ""): Promise<UsuarioDTO[]> {
    const todos = normalizarLista(await listarTolerante(() => this.repository.listar()));
    const termo = normalizar(busca).trim();
    if (termo === "") return todos;
    return todos.filter((usuario) => combina(usuario, termo));
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

  alternarStatus(id: number, isActive: boolean): Promise<MessageResponse> {
    return this.repository.alternarStatus(id, isActive);
  }
}
