import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { LoginResponse, MessageResponse, UsuarioDTO } from "../../shared/types/api";

export interface InterfaceAutenticacaoRepository {
  login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioDTO }>;
}

export class AutenticacaoRepository implements InterfaceAutenticacaoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  async login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioDTO }> {
    const data = await this.http.post<LoginResponse | MessageResponse>("/autenticacao/login", {
      email,
      senha,
    });

    if (
      "token" in data &&
      typeof data.token === "string" &&
      "usuario" in data &&
      data.usuario &&
      typeof data.usuario === "object"
    ) {
      return { token: data.token, usuario: data.usuario };
    }

    throw new Error("Resposta de login inválida.");
  }
}
