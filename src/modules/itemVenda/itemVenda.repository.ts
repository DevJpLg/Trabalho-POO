import ItemVenda from "./index";
import Produto, { Classificacao } from "../produto";
import { StatusVenda } from "../venda";
import { prisma } from "../../shared/database";
import type { PrismaClient, ItemVenda as ItemVendaModel, Produto as ProdutoModel } from "../../generated/prisma/client";

type ItemVendaComProdutoModel = ItemVendaModel & { produto: ProdutoModel };
export interface InterfaceItemVendaRepository {
    adicionarItem(item: ItemVenda): Promise<number | null>;
    adicionarQuantidadeItem(item: ItemVenda, qtd: number): Promise<boolean>;
    removerQuantidadeItem(item: ItemVenda, qtd: number): Promise<boolean>;
    listarItensVenda(vendaId: number, busca?: string): Promise<ItemVenda[] | null>;
    listarItensPendentes(vendaId: number): Promise<ItemVenda[] | null>;
    buscarItemPorId(id: number): Promise<ItemVenda | null>;
    buscarItemPorVendaEProduto(vendaId: number, produtoId: number): Promise<ItemVenda | null>;
    buscarStatusVenda(vendaId: number): Promise<StatusVenda | null>;
    atualizarAprovacao(item: ItemVenda): Promise<boolean>;
    removerItem(item: ItemVenda): Promise<boolean>;
}
export default class ItemVendaRepository implements InterfaceItemVendaRepository {
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
            isActive: rows.isActive,
        });
    }

    private rebuildItemVenda(rows: ItemVendaComProdutoModel): ItemVenda {
        return new ItemVenda(rows.id, {
            quantidade: rows.quantidade,
            aprovadoFarmaceutico: rows.aprovadoFarmaceutico,
            vendaId: rows.vendaId,
            produtoId: rows.produtoId,
            produto: this.rebuildProduto(rows.produto),
        });
    }

    public async adicionarItem(item: ItemVenda): Promise<number | null> {
        const resultado = await this.prisma.itemVenda.create({
            data: {
                quantidade: item.getQuantidade(),
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
                vendaId: item.getVendaId(),
                produtoId: item.getProdutoId(),
            },
        });
        return resultado.id ?? null;
    }

    public async adicionarQuantidadeItem(item: ItemVenda, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: {
                quantidade: { increment: qtd },
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
            },
        });
        return resultado ? true : false;
    }

    public async removerQuantidadeItem(item: ItemVenda, qtd: number): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: {
                quantidade: { decrement: qtd },
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
            },
        });
        return resultado ? true : false;
    }

    public async listarItensVenda(vendaId: number, busca: string = ""): Promise<ItemVenda[] | null> {
        const filtroProduto = busca === "" ? {} : {
            produto: { OR: [
                { nome: { contains: busca } },
                { tarja: { contains: busca } },
                { fabricante: { contains: busca } },
                { principioAtivo: { contains: busca } },
                { categoria: { contains: busca } },
                { codigoBarras: { contains: busca } }
            ]}
        };

        const resultado = await this.prisma.itemVenda.findMany({
            where: { vendaId: vendaId, ...filtroProduto },
            include: { produto: true },
            orderBy: { id: "asc" },
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => this.rebuildItemVenda(rows));
        }
        return null;
    }

    public async listarItensPendentes(vendaId: number): Promise<ItemVenda[] | null> {
        const resultado = await this.prisma.itemVenda.findMany({
            where: { AND: [
                { vendaId: vendaId },
                { aprovadoFarmaceutico: false }
            ]},
            include: { produto: true },
            orderBy: { id: "asc" },
        });

        if (resultado.length > 0) {
            return resultado.map((rows) => this.rebuildItemVenda(rows));
        }
        return null;
    }

    public async buscarItemPorId(id: number): Promise<ItemVenda | null> {
        const resultado = await this.prisma.itemVenda.findUnique({
            where: { id: id },
            include: { produto: true },
        });
        if (resultado !== null) {
            return this.rebuildItemVenda(resultado);
        }
        return null;
    }

    public async buscarItemPorVendaEProduto(vendaId: number, produtoId: number): Promise<ItemVenda | null> {
        const resultado = await this.prisma.itemVenda.findFirst({
            where: { AND: [
                { vendaId: vendaId },
                { produtoId: produtoId }
            ]},
            include: { produto: true },
        });
        if (resultado !== null) {
            return this.rebuildItemVenda(resultado);
        }
        return null;
    }

    public async buscarStatusVenda(vendaId: number): Promise<StatusVenda | null> {
        const resultado = await this.prisma.venda.findUnique({
            where: { id: vendaId },
            select: { status: true },
        });
        if (resultado !== null) {
            return resultado.status as StatusVenda;
        }
        return null;
    }

    public async atualizarAprovacao(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: { aprovadoFarmaceutico: item.getAprovadoFarmaceutico() },
        });
        return resultado ? true : false;
    }

    public async removerItem(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.delete({
            where: { id: item.getId() },
        });
        return resultado ? true : false;
    }
}