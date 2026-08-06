import ItemVenda from "./index";
import { StatusVenda } from "../venda";
import { prisma } from "../../shared/database";
import type { PrismaClient, ItemVenda as ItemVendaModel } from "../../generated/prisma/client";
export interface InterfaceItemVendaRepository {
    adicionarItem(item: ItemVenda): Promise<boolean>;
    listarItensVenda(vendaId: number): Promise<ItemVenda[] | null>;
    listarItensPendentes(vendaId: number): Promise<ItemVenda[] | null>;
    buscarItemPorId(id: number): Promise<ItemVenda | null>;
    buscarItemPorVendaEProduto(vendaId: number, produtoId: number): Promise<ItemVenda | null>;
    buscarStatusVenda(vendaId: number): Promise<StatusVenda | null>;
    editarItem(item: ItemVenda): Promise<boolean>;
    atualizarAprovacao(item: ItemVenda): Promise<boolean>;
    atualizarAprovacaoEmLote(itens: ItemVenda[]): Promise<boolean>;
    removerItem(id: number): Promise<boolean>;
    removerItensEmLote(ids: number[]): Promise<boolean>;
}
export default class ItemVendaRepository implements InterfaceItemVendaRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.prisma = client;
    }

    private rebuildItemVenda(rows: ItemVendaModel): ItemVenda {
        return new ItemVenda(rows.id, {
            quantidade: rows.quantidade,
            aprovadoFarmaceutico: rows.aprovadoFarmaceutico,
            vendaId: rows.vendaId,
            produtoId: rows.produtoId,
        });
    }

    public async adicionarItem(item: ItemVenda): Promise<boolean> {
        let retorno = false;

        const resultado = await this.prisma.itemVenda.create({
            data: {
                quantidade: item.getQuantidade(),
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
                vendaId: item.getVendaId(),
                produtoId: item.getProdutoId(),
            },
        });

        if (resultado.id) {
            retorno = true;
        }
        return retorno;
    }

    public async listarItensVenda(vendaId: number): Promise<ItemVenda[] | null> {
        const resultado = await this.prisma.itemVenda.findMany({
            where: { vendaId: vendaId },
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

    public async editarItem(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: {
                quantidade: item.getQuantidade(),
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
            },
        });
        return resultado ? true : false;
    }

    public async atualizarAprovacao(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: { aprovadoFarmaceutico: item.getAprovadoFarmaceutico() },
        });
        return resultado ? true : false;
    }

    // Grava a aprovação de todos os itens em uma única transação:
    // ou a venda inteira é avaliada, ou nada é gravado.
    public async atualizarAprovacaoEmLote(itens: ItemVenda[]): Promise<boolean> {
        if (itens.length === 0) {
            return false;
        }

        const operacoes = itens.map((item) => this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: { aprovadoFarmaceutico: item.getAprovadoFarmaceutico() },
        }));

        const resultado = await this.prisma.$transaction(operacoes);
        return resultado.length === itens.length;
    }


    public async removerItem(id: number): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.delete({
            where: { id: id },
        });
        return resultado ? true : false;
    }


    public async removerItensEmLote(ids: number[]): Promise<boolean> {
        if (ids.length === 0) {
            return false;
        }

        const operacoes = ids.map((id) => this.prisma.itemVenda.delete({
            where: { id: id },
        }));

        const resultado = await this.prisma.$transaction(operacoes);
        return resultado.length === ids.length;
    }
}
