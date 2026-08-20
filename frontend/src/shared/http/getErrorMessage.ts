import { ApiError } from "../http/HttpClient";

export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (error instanceof ApiError) {
    if (
      error.status >= 500 &&
      (error.message.startsWith("Erro HTTP") || /proxy|ECONNREFUSED/i.test(error.message))
    ) {
      return "Não foi possível conectar à API. Verifique se o backend está rodando na porta 3333.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
