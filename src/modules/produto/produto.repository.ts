import Produto, { Classificacao, DadosProduto } from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceProdutoRepository {
    cadastrarProduto(produto: Produto): Promise<boolean>;
    listarProdutos(busca: string): Promise<Produto[] | null>;
    buscarProduto(busca: string): Promise<Produto[] | null>;
    buscarProdutoPorId(id: number): Promise<Produto | null>;
    buscarProdutoPorCodigoBarras(codigoBarras: string): Promise<Produto | null>;
    buscarQuantidadeEstoque(id: number): Promise<number | null>
    buscarDataVencimento(id: number): Promise<Date | null>;
    buscarIsActiveProduto(id: number): Promise<boolean | null>;
    listarProdutosPorValidade(dataLimite: Date): Promise<Produto[] | null>;
    editarProduto(produto: Produto): Promise<boolean>;
    deletarProduto(id: number): Promise<boolean>;
    realizarEntrada(produto: Produto, qtd: number): Promise<boolean>;
    realizarBaixa(id: number, qtd: number): Promise<boolean>;
    alterarValidade(produto: Produto, novaData: Date): Promise<boolean>;
    bloquearProduto(produto: Produto): Promise<boolean>;
    desbloquearProduto(produto: Produto): Promise<boolean>;
}

export class ProdutoRepository implements InterfaceProdutoRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.prisma = client;
    }


    /* ! ========== Cadastrar Produto ========== */
    public async cadastrarProduto(produto: Produto): Promise<boolean> {
        let retorno = false;

        const resultado = await this.prisma.produto.create({
            data: {
                nome: produto.getNome(),
                codigoBarras: produto.getCodigoBarras(),
                descricao: produto.getDescricao(),
                principioAtivo: produto.getPrincipioAtivo(),
                concentracao: produto.getConcentracao(),
                formaFarmaceutica: produto.getFormaFarmaceutica(),
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
                isActive: produto.getIsActive(),
            },
        });

        if (resultado.id) {
            retorno = true;
        }
        return retorno;
    }


    /* ! ========== Listar Produtos ========== */
    public async listarProdutos(busca: string): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { OR: [
                { nome: { contains: busca } },
                { codigoBarras: { contains: busca } },
                { principioAtivo: { contains: busca } },
                { fabricante: { contains: busca } },
                { categoria: { contains: busca } }
            ]}
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => 
                Produto.rebuildProduto(rows.id, {
                    nome: rows.nome,
                    codigoBarras: rows.codigoBarras,
                    descricao: rows.descricao,
                    principioAtivo: rows.principioAtivo,
                    concentracao: rows.concentracao,
                    formaFarmaceutica: rows.formaFarmaceutica,
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
                }, rows.isActive),
            );
        }
        return null;
    }


    /* ! ========== Buscar Produto ========== */
    public async buscarProduto(busca: string): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { AND: [
                { OR: [
                    { nome: { contains: busca } },
                    { codigoBarras: { contains: busca } },
                    { principioAtivo: { contains: busca } },
                    { fabricante: { contains: busca } },
                    { categoria: { contains: busca } }
                ]},
                { quantidadeEstoque: { gt: 0 } },
                { validade: { gt: new Date() } },
                { isActive: true }
            ]}
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => 
                Produto.rebuildProduto(rows.id, {
                    nome: rows.nome,
                    codigoBarras: rows.codigoBarras,
                    descricao: rows.descricao,
                    principioAtivo: rows.principioAtivo,
                    concentracao: rows.concentracao,
                    formaFarmaceutica: rows.formaFarmaceutica,
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
                }, rows.isActive),
            );
        }
        return null;
    }


    /* ! ========== Buscar Produto Por Id ========== */
    public async buscarProdutoPorId(id: number): Promise<Produto | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { id: id },
        });

        if (resultado !== null) {
            return Produto.rebuildProduto(resultado.id, {
                nome: resultado.nome,
                codigoBarras: resultado.codigoBarras,
                descricao: resultado.descricao,
                principioAtivo: resultado.principioAtivo,
                concentracao: resultado.concentracao,
                formaFarmaceutica: resultado.formaFarmaceutica,
                fabricante: resultado.fabricante,
                numeroRegAnvisa: resultado.numeroRegAnvisa,
                tarja: resultado.tarja,
                categoria: resultado.categoria,
                classificacao: resultado.classificacao as Classificacao,
                quantidadeEstoque: resultado.quantidadeEstoque,
                localEstoque: resultado.localEstoque,
                validade: resultado.validade,
                classeControle: resultado.classeControle,
                retencaoReceita: resultado.retencaoReceita,
                validadeReceita: resultado.validadeReceita,
                generico: resultado.generico,
                lote: resultado.lote,
                preco: Number(resultado.preco),
                dataFabricacao: resultado.dataFabricacao,
                quantidadeMaxima: resultado.quantidadeMaxima,
            }, resultado.isActive);
        }
        return null;
    }


    /* ! ========== Buscar Produto Por Código de Barras ========== */
    public async buscarProdutoPorCodigoBarras(codigoBarras: string): Promise<Produto | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { codigoBarras: codigoBarras },
        });
        if (resultado !== null) {
            return Produto.rebuildProduto(resultado.id, {
                nome: resultado.nome,
                codigoBarras: resultado.codigoBarras,
                descricao: resultado.descricao,
                principioAtivo: resultado.principioAtivo,
                concentracao: resultado.concentracao,
                formaFarmaceutica: resultado.formaFarmaceutica,
                fabricante: resultado.fabricante,
                numeroRegAnvisa: resultado.numeroRegAnvisa,
                tarja: resultado.tarja,
                categoria: resultado.categoria,
                classificacao: resultado.classificacao as Classificacao,
                quantidadeEstoque: resultado.quantidadeEstoque,
                localEstoque: resultado.localEstoque,
                validade: resultado.validade,
                classeControle: resultado.classeControle,
                retencaoReceita: resultado.retencaoReceita,
                validadeReceita: resultado.validadeReceita,
                generico: resultado.generico,
                lote: resultado.lote,
                preco: Number(resultado.preco),
                dataFabricacao: resultado.dataFabricacao,
                quantidadeMaxima: resultado.quantidadeMaxima,
            }, resultado.isActive);
        }
        return null;
    }


    /* ! ========== Buscar Quantidade de Estoque ========== */
    public async buscarQuantidadeEstoque(id: number): Promise<number | null> {
        const resultado = await this.prisma.produto.findFirst({
            where: { id: id },
            select: { quantidadeEstoque: true },
        });
        if (resultado !== null) {
            return resultado.quantidadeEstoque;
        }
        return null;
    }


    /* ! ========== Buscar Data de Vencimento ========== */
    public async buscarDataVencimento(id: number): Promise<Date | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { id: id },
            select: { validade: true },
        });
        if (resultado !== null) {
            return resultado.validade;
        }
        return null;
    }


    /* ! ========== Buscar Is Active Produto ========== */
    public async buscarIsActiveProduto(id: number): Promise<boolean | null> {
        const resultado = await this.prisma.produto.findUnique({
            where: { id: id },
            select: { isActive: true },
        });
        if (resultado !== null) {
            return resultado.isActive;
        }
        return null;
    }


    /* ! ========== Listar Produtos Por Validade ========== */
    public async listarProdutosPorValidade(dataLimite: Date): Promise<Produto[] | null> {
        const resultado = await this.prisma.produto.findMany({
            where: { validade: { lte: dataLimite } },
            orderBy: { validade: "asc" },
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => 
                Produto.rebuildProduto(rows.id, {
                    nome: rows.nome,
                    codigoBarras: rows.codigoBarras,
                    descricao: rows.descricao,
                    principioAtivo: rows.principioAtivo,
                    concentracao: rows.concentracao,
                    formaFarmaceutica: rows.formaFarmaceutica,
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
                }, rows.isActive),
            );
        }
        return null;
    }


    /* ! ========== Editar Produto ========== */
    public async editarProduto(produto: Produto): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: {
                nome: produto.getNome(),
                codigoBarras: produto.getCodigoBarras(),
                descricao: produto.getDescricao(),
                principioAtivo: produto.getPrincipioAtivo(),
                concentracao: produto.getConcentracao(),
                formaFarmaceutica: produto.getFormaFarmaceutica(),
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
                isActive: produto.getIsActive(),
            },
        });
        return resultado ? true : false;
    }


    /* ! ========== Deletar Produto ========== */
    public async deletarProduto(id: number): Promise<boolean> {
        const resultado = await this.prisma.produto.delete({
            where: { id: id },
        });
        return resultado ? true : false;
    }


    /* ! ========== Realizar Entrada ========== */
    public async realizarEntrada(produto: Produto, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { quantidadeEstoque: { increment: qtd } },
        });
        return resultado ? true : false;
    }


    /* ! ========== Realizar Baixa ========== */
    public async realizarBaixa(id: number, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: id},
            data: { quantidadeEstoque: { decrement: qtd } },
        });
        return resultado ? true : false;
    }


    /* ! ========== Alterar Validade ========== */
    public async alterarValidade(produto: Produto, novaData: Date): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { validade: novaData },
        });
        return resultado ? true : false;
    }


    /* ! ========== Bloquear Produto ========== */
    public async bloquearProduto(produto: Produto): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { isActive: false },
        });
        return resultado ? true : false;
    }


    /* ! ========== Desbloquear Produto ========== */
    public async desbloquearProduto(produto: Produto): Promise<boolean> {
        const resultado = await this.prisma.produto.update({
            where: { id: produto.getId() },
            data: { isActive: true },
        });
        return resultado ? true : false;
    }
}