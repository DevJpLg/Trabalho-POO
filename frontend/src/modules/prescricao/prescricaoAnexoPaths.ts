/** Espelha `src/shared/storage/prescricaoArquivo.ts` (somente helpers de exibição). */
export function nomeArquivoDoAnexo(anexo: string): string {
  const partes = anexo.replace(/\\/g, "/").split("/");
  return partes[partes.length - 1] || anexo;
}
