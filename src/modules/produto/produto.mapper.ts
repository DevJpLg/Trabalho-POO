import { Classificacao, DadosProduto } from "./index";

export default class ProdutoMapper {

    public async EstruturarDadosProduto(dados: Record<string, unknown>): Promise<DadosProduto> {
        return {
            nome: String(dados.nome ?? ""),
            codigoBarras: String(dados.codigoBarras ?? ""),
            principioAtivo: String(dados.principioAtivo ?? ""),
            fabricante: String(dados.fabricante ?? ""),
            categoria: String(dados.categoria ?? ""),
            preco: Number(dados.preco ?? 0),
            descricao: dados.descricao as string | null | undefined,
            concentracao: dados.concentracao as string | null | undefined,
            formulaFarmaceutica: dados.formulaFarmaceutica as string | null | undefined,
            numeroRegAnvisa: dados.numeroRegAnvisa as string | null | undefined,
            tarja: dados.tarja as string | null | undefined,
            classificacao: dados.classificacao as Classificacao | undefined,
            quantidadeEstoque: dados.quantidadeEstoque != null ? Number(dados.quantidadeEstoque) : undefined,
            localEstoque: dados.localEstoque as string | null | undefined,
            validade: dados.validade ? new Date(String(dados.validade)) : null,
            classeControle: dados.classeControle as string | null | undefined,
            retencaoReceita: dados.retencaoReceita as boolean | undefined,
            validadeReceita: dados.validadeReceita != null ? Number(dados.validadeReceita) : null,
            generico: dados.generico as boolean | undefined,
            lote: dados.lote as string | null | undefined,
            dataFabricacao: dados.dataFabricacao ? new Date(String(dados.dataFabricacao)) : null,
            quantidadeMaxima: dados.quantidadeMaxima != null ? Number(dados.quantidadeMaxima) : null,
        };
    }
}
