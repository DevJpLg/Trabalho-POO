import Notificacao, { TipoNotificacao } from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceNotificacaoRepository {
    registrarNotificacao(notificacao: Notificacao): Promise<boolean>;
    listarNotificacoes(): Promise<Notificacao[] | null>;
    buscarNotificacaoPorId(id: number): Promise<Notificacao | null>;
    buscarNotificacaoAbertaPorVendaId(vendaId: number): Promise<Notificacao | null>;
    resolverNotificacao(notificacao: Notificacao): Promise<boolean>;
}

export class NotificacaoRepository implements InterfaceNotificacaoRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.prisma = client;
    }

    /* ! ========== Registrar Notificação ========== */
    public async registrarNotificacao(notificacao: Notificacao): Promise<boolean> {
        const resultado = await this.prisma.notificacao.create({
            data: {
                id: notificacao.getId(),
                tipo: notificacao.getTipo(),
                dataHora: notificacao.getDataHora(),
                resolvida: notificacao.getResolvida(),
                vendaId: notificacao.getVendaId(),
            },
        });
        return resultado ? true : false;
    }

    /* ! ========== Listar Notificações abertas ========== */
    public async listarNotificacoes(): Promise<Notificacao[] | null> {
        const resultado = await this.prisma.notificacao.findMany({
            where: { resolvida: false },
            orderBy: { dataHora: "desc" },
        });

        if (resultado.length === 0) {
            return null;
        }

        return resultado.map((row) =>
            Notificacao.rebuildNotificacao(
                row.id,
                row.tipo as TipoNotificacao,
                row.vendaId,
                row.dataHora,
                row.resolvida,
            ),
        );
    }

    /* ! ========== Buscar Notificação por ID ========== */
    public async buscarNotificacaoPorId(id: number): Promise<Notificacao | null> {
        const resultado = await this.prisma.notificacao.findUnique({
            where: { id: id },
        });

        if (resultado === null) {
            return null;
        }

        return Notificacao.rebuildNotificacao(
            resultado.id,
            resultado.tipo as TipoNotificacao,
            resultado.vendaId,
            resultado.dataHora,
            resultado.resolvida,
        );
    }

    /* ! ========== Buscar notificação aberta da venda ========== */
    public async buscarNotificacaoAbertaPorVendaId(vendaId: number): Promise<Notificacao | null> {
        const resultado = await this.prisma.notificacao.findFirst({
            where: {
                vendaId: vendaId,
                resolvida: false,
            },
        });

        if (resultado === null) {
            return null;
        }

        return Notificacao.rebuildNotificacao(
            resultado.id,
            resultado.tipo as TipoNotificacao,
            resultado.vendaId,
            resultado.dataHora,
            resultado.resolvida,
        );
    }

    /* ! ========== Resolver Notificação ========== */
    public async resolverNotificacao(notificacao: Notificacao): Promise<boolean> {
        const resultado = await this.prisma.notificacao.update({
            where: { id: notificacao.getId() },
            data: { resolvida: notificacao.getResolvida() },
        });
        return resultado ? true : false;
    }
}
