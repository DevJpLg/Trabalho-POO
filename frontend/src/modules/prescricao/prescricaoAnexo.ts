import { nomeArquivoDoAnexo } from "./prescricaoAnexoPaths";

export const TAMANHO_MAX_PDF_BYTES = 1.5 * 1024 * 1024;

export function validarArquivoPdf(file: File): void {
  const ehPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) {
    throw new Error("Envie um arquivo PDF.");
  }
  if (file.size > TAMANHO_MAX_PDF_BYTES) {
    throw new Error("PDF muito grande. Use até 1,5 MB.");
  }
}

export function rotuloAnexoPrescricao(anexo: string | null | undefined): string {
  const texto = (anexo ?? "").trim();
  if (!texto) return "Sem anexo";
  if (texto.startsWith("prescricoes/")) {
    return nomeArquivoDoAnexo(texto);
  }
  return texto;
}

/** Rota autenticada que devolve o PDF salvo em disco. */
export function rotaArquivoPrescricao(prescricaoId: number): string {
  return `/prescricoes/${prescricaoId}/arquivo`;
}
