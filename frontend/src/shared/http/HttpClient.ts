export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface InterfaceHttpClient {
  get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T = void>(path: string): Promise<T>;
}

type TokenProvider = () => string | null;

export class HttpClient implements InterfaceHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = void>(path: string): Promise<T> {
    return this.request<T>(this.buildUrl(path), { method: "DELETE" });
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
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

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, { ...init, headers });

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : `Erro HTTP ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data as T;
  }
}
