import Produto, { Classificacao } from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient, Produto as ProdutoModel } from "../../generated/prisma/client";

export interface InterfaceProdutoRepository {
    cadastrarProduto(produto: Produto): Promise<boolean>;
    listarProdutos(busca: string): Promise<Produto[] | null>;
    buscarProduto(busca: string): Promise<Produto[] | null>;
    buscarProdutoPorId(id: number): Promise<Produto | null>;
    buscarProdutoPorCodigoBarras(codigoBarras: string): Promise<Produto | null>;
    listarProdutosPorValidade(dataLimite: Date): Promise<Produto[] | null>;
    editarProduto(produto: Produto): Promise<boolean>;
    deletarProduto(id: number): Promise<boolean>;
    realizarEntrada(produto: Produto, qtd: number): Promise<boolean>;
    realizarBaixa(produto: Produto, qtd: number): Promise<boolean>;
    alterarValidade(produto: Produto, novaData: Date): Promise<boolean>;
    bloquearProduto(produto: Produto): Promise<boolean>;
}

export default class ProdutoRepository implements InterfaceProdutoRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.prisma = client;
    }


    private rebuildProduto(rows: ProdutoModel): Produto {
        return new Produto(rows.id, {
            nome: rows.nome,
            codigoBarras: rows.codigoBarras,
            descricao: rows.descricao,
            principioAtivo: rows.principioAtivo,
            concentracao: rows.concentracao,
            formulaFarmaceutica: rows.formulaFarmaceutica,
            fabricante: rows.fabricante,
            numeroRegAnvisa: rows.numeroRegAnvisa,
            tarja: rows.tarja,
            categoria: rows.categoria,
            classificacao: rows.classificacao as Classificacao,
            quantidadeEstoque: rows.quantidadeEstoque,
            localEstoque: rows.localEstoque,
            validade: rows.validade,
            classeControle: rows.classeControle,
            retencaoReceita: rows.retencaoReceita,
            validadeReceita: rows.validadeReceita,
            generico: rows.generico,
            lote: rows.lote,
            preco: Number(rows.preco),
            dataFabricacao: rows.dataFabricacao,
            quantidadeMaxima: rows.quantidadeMaxima,
        });
    }


    public async cadastrarProduto(produto: Produto): Promise<boolean> {
        let retorno = false;

        const resultado = await this.prisma.produto.create({
            data: {
                nome: produto.getNome(),
                codigoBarras: produto.getCodigoBarras(),
                descricao: produto.getDescricao(),
                principioAtivo: produto.getPrincipioAtivo(),
                concentracao: produto.getConcentracao(),
                formulaFarmaceutica: produto.getFormulaFarmaceutica(),
                fabricante: produto.getFabricante(),
                numeroRegAnvisa: produto.getNumeroRegAnvisa(),
                tarja: produto.getTarja(),
                categoria: produto.getCategoria(),
                classificacao: produto.getClassificacao(),
                quantidadeEstoque: produto.getQuantidadeEstoque(),
                localEstoque: produto.getLocalEstoque(),
                validade: produto.getValidade(),
                classeControle: produto.getClasseControle(),
                retencaoReceita: produto.getRetencaoReceita(),
                validadeReceita: produto.getValidadeReceita(),
                generico: produto.getGenerico(),
                lote: produto.getLote(),
                preco: produto.getPreco(),
                dataFabricacao: produto.getDataFabricacao(),
                quantidadeMaxima: produto.getQuantidadeMaxima(),
            },
        });

        if (resultado.id) {
            retorno = true;
        }
        return retorno;
    }


    public async listarProdutos(busca: string): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { OR: [
                { nome: { contains: busca } },
                { codigoBarras: { contains: busca } },
                { principioAtivo: { contains: busca } },
                { fabricante: { contains: busca } }
            ]}
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => this.rebuildProduto(rows));
        }
        return null;
    }


    public async buscarProduto(busca: string): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { AND: [
                { OR: [
                    { nome: { contains: busca } },
                    { codigoBarras: { contains: busca } },
                    { principioAtivo: { contains: busca } },
                    { fabricante: { contains: busca } }
                ]},
                { quantidadeEstoque: { gt: 0 } },
                { validade: { gt: new Date() } }
            ]}
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => this.rebuildProduto(rows));
        }
        return null;
    }


    public async buscarProdutoPorId(id: number): Promise<Produto | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { id: id },
        });
        return resultado ? this.rebuildProduto(resultado) : null;
    }


    public async buscarProdutoPorCodigoBarras(codigoBarras: string): Promise<Produto | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { codigoBarras: codigoBarras },
        });
        return resultado ? this.rebuildProduto(resultado) : null;
    }


    public async listarProdutosPorValidade(dataLimite: Date): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { validade: { lte: dataLimite } },
            orderBy: { validade: "asc" },
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => this.rebuildProduto(rows));
        }
        return null;
    }


    public async editarProduto(produto: Produto): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: {
                nome: produto.getNome(),
                codigoBarras: produto.getCodigoBarras(),
                descricao: produto.getDescricao(),
                principioAtivo: produto.getPrincipioAtivo(),
                concentracao: produto.getConcentracao(),
                formulaFarmaceutica: produto.getFormulaFarmaceutica(),
                fabricante: produto.getFabricante(),
                numeroRegAnvisa: produto.getNumeroRegAnvisa(),
                tarja: produto.getTarja(),
                categoria: produto.getCategoria(),
                classificacao: produto.getClassificacao(),
                quantidadeEstoque: produto.getQuantidadeEstoque(),
                localEstoque: produto.getLocalEstoque(),
                validade: produto.getValidade(),
                classeControle: produto.getClasseControle(),
                retencaoReceita: produto.getRetencaoReceita(),
                validadeReceita: produto.getValidadeReceita(),
                generico: produto.getGenerico(),
                lote: produto.getLote(),
                preco: produto.getPreco(),
                dataFabricacao: produto.getDataFabricacao(),
                quantidadeMaxima: produto.getQuantidadeMaxima(),
            },
        });
        return resultado ? true : false;
    }


    public async deletarProduto(id: number): Promise<boolean> {
        const resultado = await this.prisma.produto.delete({
            where: { id: id },
        });
        return resultado ? true : false;
    }


    public async realizarEntrada(produto: Produto, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { quantidadeEstoque: { increment: qtd } },
        });
        return resultado ? true : false;
    }


    public async realizarBaixa(produto: Produto, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId(), quantidadeEstoque: { gte: qtd } },
            data: { quantidadeEstoque: { decrement: qtd } },
        });
        return resultado ? true : false;
    }


    public async alterarValidade(produto: Produto, novaData: Date): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { validade: novaData },
        });
        return resultado ? true : false;
    }


    public async bloquearProduto(produto: Produto): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { quantidadeEstoque: 0 },
        });
        return resultado ? true : false;
    }
}