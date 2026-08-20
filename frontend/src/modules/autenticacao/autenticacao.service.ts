import type { UsuarioDTO } from "../../shared/types/api";
import type { InterfaceAutenticacaoRepository } from "./autenticacao.repository";

export interface InterfaceAutenticacaoService {
  login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioDTO }>;
}

export class AutenticacaoService implements InterfaceAutenticacaoService {
  constructor(private readonly repository: InterfaceAutenticacaoRepository) {}

  login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioDTO }> {
    return this.repository.login(email.trim(), senha);
  }
}
