import { paraInputDate } from "../../shared/ui/format";
import type { ProdutoDTO, ProdutoInput } from "../../shared/types/api";

/** Converte o produto devolvido pela API no formato do formulário de cadastro/edição. */
export function produtoParaInput(produto: ProdutoDTO): ProdutoInput {
  return {
    nome: produto.nome,
    codigoBarras: produto.codigoBarras,
    principioAtivo: produto.principioAtivo,
    fabricante: produto.fabricante,
    categoria: produto.categoria,
    preco: Number(produto.preco),
    descricao: produto.descricao ?? "",
    concentracao: produto.concentracao ?? "",
    formaFarmaceutica: produto.formaFarmaceutica ?? "",
    numeroRegAnvisa: produto.numeroRegAnvisa ?? "",
    tarja: produto.tarja ?? "",
    classificacao: produto.classificacao,
    quantidadeEstoque: produto.quantidadeEstoque,
    localEstoque: produto.localEstoque ?? "",
    validade: paraInputDate(produto.validade),
    classeControle: produto.classeControle ?? "",
    retencaoReceita: produto.retencaoReceita,
    validadeReceita: produto.validadeReceita,
    generico: produto.generico,
    lote: produto.lote ?? "",
    dataFabricacao: paraInputDate(produto.dataFabricacao),
    quantidadeMaxima: produto.quantidadeMaxima,
    isActive: produto.isActive,
  };
}
