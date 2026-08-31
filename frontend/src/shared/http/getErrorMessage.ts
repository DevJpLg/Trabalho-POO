import { ApiError } from "./HttpClient";

/**
 * Mensagens que o backend devolve com status 400 quando a consulta **funcionou**
 * mas não encontrou registros. Do ponto de vista da UI isso é lista vazia, não erro.
 *
 * (Ver ERROS_BACKEND.md — o padrão correto seria 200 com `[]`.)
 */
const MENSAGENS_LISTA_VAZIA = [
  "nenhum produto encontrado",
  "nenhum item encontrado na venda",
  "nenhuma prescrição encontrada",
  "nenhuma prescricao encontrada",
  "nenhuma venda encontrada",
  "prescricao não encontrada",
  "prescrição não encontrada",
];

const MENSAGENS_NAO_AUTORIZADO = ["usuário não autorizado", "usuario não autorizado"];

function normalizar(valor: string): string {
  return valor.trim().toLowerCase();
}

/** 401 sem mensagem própria (ou vindo do authGuard) significa sessão inválida. */
function semMensagemUtil(mensagem: string): boolean {
  const texto = normalizar(mensagem);
  return texto === "" || texto.startsWith("erro http") || texto.includes("token");
}

export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (error instanceof ApiError) {
    if (error.semConexao) {
      return "Não foi possível conectar à API. Verifique se o backend está rodando na porta 3333.";
    }
    if (error.timeout) {
      return "A API demorou demais para responder. Tente novamente.";
    }
    if (error.status === 401 && semMensagemUtil(error.message)) {
      return "Sessão expirada. Entre novamente.";
    }
    if (error.status === 501) {
      return "Esta funcionalidade ainda não foi implementada no backend.";
    }
    const mensagem = normalizar(error.message);
    if (mensagem.includes("erro ao deletar produto")) {
      return "Não foi possível excluir o produto. Se ele já foi vendido, tente bloqueá-lo.";
    }
    if (mensagem.includes("erro ao deletar usuario") || mensagem.includes("erro ao deletar usuário")) {
      return "Não foi possível excluir o usuário. Tente inativá-lo pelo cadastro.";
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

/** `true` quando o erro é, na verdade, "a consulta não retornou registros". */
export function isListaVazia(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 400) return false;
  const mensagem = normalizar(error.message);
  return MENSAGENS_LISTA_VAZIA.some((texto) => mensagem.includes(texto));
}

/** `true` quando o backend recusou a ação por perfil do usuário. */
export function isNaoAutorizado(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 403) return true;
  const mensagem = normalizar(error.message);
  return MENSAGENS_NAO_AUTORIZADO.some((texto) => mensagem.includes(texto));
}

/**
 * Executa uma listagem tratando "lista vazia" (400 do backend) como `[]`.
 * Qualquer outro erro continua sendo propagado.
 */
export async function listarTolerante<T>(consulta: () => Promise<T[]>): Promise<T[]> {
  try {
    return (await consulta()) ?? [];
  } catch (error) {
    if (isListaVazia(error)) return [];
    throw error;
  }
}
