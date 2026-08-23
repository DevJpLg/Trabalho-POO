/**
 * Conserto de acentuação vinda da API.
 *
 * Alguns registros chegam com os bytes UTF-8 lidos como se fossem de outra
 * tabela de caracteres — o caso clássico é "Farmacêutico" virar
 * "Farmac├¬utico" (bytes `C3 AA` exibidos pela CP437 do terminal do Windows)
 * ou "JoÃ£o" (os mesmos bytes lidos como Latin-1).
 *
 * O dado só é corrigido de verdade no banco, mas dá para desfazer a troca na
 * exibição: cada caractere volta a ser o byte que o originou e a sequência é
 * relida como UTF-8. A conversão só é aceita quando o resultado é UTF-8 válido
 * E ficou menor E não sobrou nenhum sinal de troca de tabela — assim texto que
 * já estava correto nunca é alterado.
 */

/** Metade alta da CP437 (0x80–0xFF), na ordem dos bytes. O último é NBSP. */
const CP437_ALTO =
  "ÇüéâäàåçêëèïîìÄÅ" +
  "ÉæÆôöòûùÿÖÜ¢£¥₧ƒ" +
  "áíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐" +
  "└┴┬├─┼╞╟╚╔╩╦╠═╬╧" +
  "╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩" +
  "≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

const CP437_PARA_BYTE = new Map<string, number>();
for (let indice = 0; indice < CP437_ALTO.length; indice += 1) {
  CP437_PARA_BYTE.set(CP437_ALTO[indice], 0x80 + indice);
}

/**
 * Sinais de que o texto passou por uma troca de tabela: desenho de caixa,
 * blocos, símbolos matemáticos ou os "Ã"/"Â" típicos de Latin-1.
 */
const SUSPEITO = /[←-■√≡⌐¬ÃÂ]/;

const decodificador = new TextDecoder("utf-8", { fatal: true });

function decodificar(bytes: number[] | null): string | null {
  if (!bytes || bytes.length === 0) return null;
  try {
    return decodificador.decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

/** Só aceita a conversão quando ela claramente desfez uma troca de tabela. */
function melhorou(original: string, candidato: string | null): candidato is string {
  return candidato !== null && candidato.length < original.length && !SUSPEITO.test(candidato);
}

/** Desfaz a leitura errada usando a CP437 e, se não colar, tentando Latin-1. */
export function corrigirAcentuacao(texto: string): string {
  if (!texto || !SUSPEITO.test(texto)) return texto;

  let porCp437: number[] | null = [];
  let porLatin1: number[] | null = [];

  for (const caractere of texto) {
    const ponto = caractere.codePointAt(0) ?? 0;

    if (porCp437) {
      const byte = ponto < 0x80 ? ponto : CP437_PARA_BYTE.get(caractere);
      if (byte === undefined) porCp437 = null;
      else porCp437.push(byte);
    }

    if (porLatin1) {
      if (ponto < 0x100) porLatin1.push(ponto);
      else porLatin1 = null;
    }

    if (!porCp437 && !porLatin1) return texto;
  }

  const viaCp437 = decodificar(porCp437);
  if (melhorou(texto, viaCp437)) return viaCp437;

  const viaLatin1 = decodificar(porLatin1);
  if (melhorou(texto, viaLatin1)) return viaLatin1;

  return texto;
}

/** Aplica a correção em todo texto de uma resposta da API, em qualquer profundidade. */
export function corrigirAcentuacaoProfunda<T>(valor: T): T {
  if (typeof valor === "string") return corrigirAcentuacao(valor) as T;

  if (Array.isArray(valor)) {
    return valor.map((item) => corrigirAcentuacaoProfunda(item)) as T;
  }

  if (valor && typeof valor === "object") {
    const saida: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
      saida[chave] = corrigirAcentuacaoProfunda(item);
    }
    return saida as T;
  }

  return valor;
}
