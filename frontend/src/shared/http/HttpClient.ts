/**
 * Cliente HTTP da aplicação.
 *
 * Responsabilidades:
 *  - montar a URL a partir da base (`VITE_API_BASE_URL`, por padrão `/api`);
 *  - anexar o token JWT quando existir;
 *  - normalizar a resposta de erro da API (`{ message }` ou `{ error }`);
 *  - abortar requisições que passem do tempo limite.
 *
 * Todo request tem timeout: sem ele a UI ficaria presa em "carregando"
 * se a API não responder.
 */

import { corrigirAcentuacao, corrigirAcentuacaoProfunda } from "../text/encoding";

/** Status sintético usado quando o request nem chegou na API (rede/DNS/porta fechada). */
export const STATUS_SEM_CONEXAO = 0;

/** Status sintético usado quando o request estourou o tempo limite. */
export const STATUS_TIMEOUT = -1;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  public get semConexao(): boolean {
    return this.status === STATUS_SEM_CONEXAO;
  }

  public get timeout(): boolean {
    return this.status === STATUS_TIMEOUT;
  }
}

export type RequestOptions = {
  /** Tempo limite em milissegundos. Padrão: `HttpClient.TIMEOUT_PADRAO`. */
  timeoutMs?: number;
};

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface InterfaceHttpClient {
  get<T>(path: string, query?: QueryParams, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = void>(path: string, options?: RequestOptions): Promise<T>;
}

type TokenProvider = () => string | null;

/** Chamado quando a API devolve 401, para o app derrubar a sessão local. */
type UnauthorizedHandler = () => void;

export class HttpClient implements InterfaceHttpClient {
  public static readonly TIMEOUT_PADRAO = 15_000;

  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenProvider,
    private readonly onUnauthorized?: UnauthorizedHandler,
  ) {}

  async get<T>(path: string, query?: QueryParams, options?: RequestOptions): Promise<T> {
    return this.request<T>(this.buildUrl(path, query), { method: "GET" }, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(this.buildUrl(path), { method: "POST", body: serializar(body) }, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(this.buildUrl(path), { method: "PUT", body: serializar(body) }, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(this.buildUrl(path), { method: "PATCH", body: serializar(body) }, options);
  }

  async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(this.buildUrl(path), { method: "DELETE" }, options);
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const base = this.baseUrl.replace(/\/$/, "");
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${normalized}`, window.location.origin);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.pathname + url.search;
  }

  private async request<T>(url: string, init: RequestInit, options?: RequestOptions): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const timeoutMs = options?.timeoutMs ?? HttpClient.TIMEOUT_PADRAO;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers, signal: controller.signal });
    } catch {
      if (controller.signal.aborted) {
        throw new ApiError("A API não respondeu a tempo.", STATUS_TIMEOUT);
      }
      throw new ApiError("Não foi possível falar com a API.", STATUS_SEM_CONEXAO);
    } finally {
      clearTimeout(timer);
    }

    const data = await lerCorpo(response);

    // 204 não deveria ter corpo, mas o DELETE de produto manda JSON mesmo assim.
    // Precisa drenar o stream (acima) senão o próximo fetch na mesma conexão falha.
    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }
      throw new ApiError(extrairMensagem(data, response.status), response.status);
    }

    return data as T;
  }
}

function serializar(body: unknown): string | undefined {
  return body !== undefined ? JSON.stringify(body) : undefined;
}

/**
 * Lê sempre como UTF-8, sem depender do `charset` declarado pela API, e passa o
 * resultado pelo conserto de acentuação (ver `shared/text/encoding`).
 */
async function lerCorpo(response: Response): Promise<unknown> {
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) return null;

  const texto = new TextDecoder("utf-8").decode(bytes);

  try {
    return corrigirAcentuacaoProfunda(JSON.parse(texto));
  } catch {
    return { message: corrigirAcentuacao(texto) };
  }
}

/**
 * O backend responde `{ message }` nos erros tratados e `{ error }` no
 * `errorHandler` global (erros não tratados). Aceitamos os dois formatos.
 */
function extrairMensagem(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const corpo = data as Record<string, unknown>;
    for (const chave of ["message", "error"] as const) {
      const valor = corpo[chave];
      if (typeof valor === "string" && valor.trim() !== "") {
        return corrigirAcentuacao(valor);
      }
    }
  }
  return `Erro HTTP ${status}`;
}
