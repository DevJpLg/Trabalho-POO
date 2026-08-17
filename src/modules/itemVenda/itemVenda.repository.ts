import ItemVenda from "./index";
import { StatusVenda } from "../venda";
import { prisma } from "../../shared/database";
import type { PrismaClient, ItemVenda as ItemVendaModel } from "../../generated/prisma/client";

export default interface InterfaceItemVendaRepository {
    adicionarItem(item: ItemVenda): Promise<boolean>;
    removerItem(item: ItemVenda): Promise<boolean>;
    atualizarQuantidadeItem(item: ItemVenda, quantidade: number): Promise<boolean>;
    listarItensVenda(vendaId: number, busca?: string): Promise<ItemVenda[] | null>;
    listarItensPendentes(vendaId: number): Promise<ItemVenda[] | null>;
    buscarItemPorId(vendaId: number, id: number): Promise<ItemVenda | null>;
    buscarItemPorProduto(vendaId: number, produtoId: number): Promise<ItemVenda | null>;
    buscarStatusVenda(vendaId: number): Promise<StatusVenda | null>;
    atualizarAprovacao(item: ItemVenda): Promise<boolean>;
}


export class ItemVendaRepository implements InterfaceItemVendaRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.prisma = client;
    }


    /* ! ========== Adicionar Item ========== */
    public async adicionarItem(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.create({
            data: {
                id: item.getId(),
                quantidade: item.getQuantidade(),
                precoUnitario: item.getPrecoUnitario(),
                exigeAvaliacao: item.getExigeAvaliacao(),
                aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
                produtoId: item.getProdutoId(),
                vendaId: item.getVendaId(),
            },
        });
        return resultado ? true : false;
    }


    /* ! ========== Atualizar Quantidade do Item ========== */
    public async atualizarQuantidadeItem(item: ItemVenda, quantidade: number): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: { quantidade: quantidade },
        });
        return resultado ? true : false;
    }


    /* ! ========== Listar ItensVenda ========== */
    public async listarItensVenda(vendaId: number, busca: string = ""): Promise<ItemVenda[] | null> {
        const resultado = await this.prisma.itemVenda.findMany({
            where: { 
                vendaId: vendaId, 
                ...(busca ==="" ? {} : {  //Se busca for vazia, não filtra nada
                    produto: { OR: [      //Se tiver busca, filtra por atributos de produto também
                        { nome: { contains: busca } },
                        { tarja: { contains: busca } },
                        { fabricante: { contains: busca } },
                        { principioAtivo: { contains: busca } },
                        { categoria: { contains: busca } },
                        { codigoBarras: { contains: busca } }
                    ]}
                })
            },
            include: { produto: true },
            orderBy: { id: "asc" },
        }); 

        if (resultado.length > 0) {
            return resultado.map((Item) => 
                ItemVenda.rebuildItemVenda(
                  Item.id,
                  Item.quantidade,
                  Number(Item.precoUnitario),
                  Item.exigeAvaliacao,
                  Item.aprovadoFarmaceutico,
                  Item.vendaId,
                  Item.produtoId, 
                )
            );
        }
        return null;
    }


    /* ! ========== Listar Itens Pendentes de Aprovação do Farmacêutico ========== */
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
            return resultado.map((Item) => 
                ItemVenda.rebuildItemVenda(
                  Item.id,
                  Item.quantidade,
                  Number(Item.precoUnitario),
                  Item.exigeAvaliacao,
                  Item.aprovadoFarmaceutico,
                  Item.vendaId,
                  Item.produtoId, 
                )
            );
        }
        return null;
    }


    /* ! ========== Buscar Item por ID ========== */
    public async buscarItemPorId(vendaId: number, id: number): Promise<ItemVenda | null> {
        const resultado = await this.prisma.itemVenda.findFirst({
            where: {
                vendaId: vendaId,
                id: id,
            },
        });
        if (resultado !== null) {
            return ItemVenda.rebuildItemVenda(
                resultado.id,
                resultado.quantidade,
                Number(resultado.precoUnitario),
                resultado.exigeAvaliacao,
                resultado.aprovadoFarmaceutico,
                resultado.vendaId,
                resultado.produtoId, 
            );
        }
        return null;
    }


    /* ! ========== Buscar Item por Produto ========== */
    public async buscarItemPorProduto(vendaId: number, produtoId: number): Promise<ItemVenda | null> {
        const resultado = await this.prisma.itemVenda.findFirst({
            where: {
                vendaId: vendaId,
                produtoId: produtoId,
            },
        });

        if (resultado !== null) {
            return ItemVenda.rebuildItemVenda(
                resultado.id,
                resultado.quantidade,
                Number(resultado.precoUnitario),
                resultado.exigeAvaliacao,
                resultado.aprovadoFarmaceutico,
                resultado.vendaId,
                resultado.produtoId,
            );
        }
        return null;
    }


    /* ! ========== Buscar Status da Venda ========== */
    public async buscarStatusVenda(vendaId: number): Promise<StatusVenda | null> {
        const resultado = await this.prisma.venda.findFirst({
            where: { id: vendaId },
            select: { status: true }
        });
        if (resultado !== null) {
            return resultado.status as StatusVenda;
        }
        return null;
    }
    

    /* ! ========== Aprovar ou Reprovar Item ========== */
    public async atualizarAprovacao(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.update({
            where: { id: item.getId() },
            data: { aprovadoFarmaceutico: item.getAprovadoFarmaceutico() },
        });
        return resultado ? true : false;
    }

    
    /* ! ========== Remover Item ========== */
    public async removerItem(item: ItemVenda): Promise<boolean> {
        const resultado = await this.prisma.itemVenda.delete({
            where: { id: item.getId() },
        });
        return resultado ? true : false;
    }
}