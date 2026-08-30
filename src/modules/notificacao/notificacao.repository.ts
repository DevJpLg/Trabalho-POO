import Notificacao from "./index";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceNotificacaoRepository {
    registrarNotificacao(notificacao: Notificacao): Promise<boolean>;
    listarNotificacoes(): Promise<Notificacao[] | null>;
    buscarNotificacaoPorId(id: number): Promise<Notificacao | null>;
    buscarNotificacaoAbertaPorVendaId(vendaId: number): Promise<Notificacao | null>;
    atenderNotificacao(notificacao: Notificacao): Promise<boolean>;
}

function reconstruirNotificacao(row: { id: number; vendaId: number; dataHora: Date; farmaceuticoId: number | null }): Notificacao {
    return Notificacao.rebuildNotificacao(row.id, row.vendaId, row.dataHora, row.farmaceuticoId);
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
                dataHora: notificacao.getDataHora(),
                vendaId: notificacao.getVendaId(),
                farmaceuticoId: notificacao.getFarmaceuticoId(),
            },
        });
        return resultado ? true : false;
    }

    /* ! ========== Listar Notificações não atendidas ========== */
    public async listarNotificacoes(): Promise<Notificacao[] | null> {
        const resultado = await this.prisma.notificacao.findMany({
            where: { farmaceuticoId: null },
            orderBy: { dataHora: "desc" },
        });

        if (resultado.length === 0) {
            return null;
        }

        return resultado.map(reconstruirNotificacao);
    }

    /* ! ========== Buscar Notificação por ID ========== */
    public async buscarNotificacaoPorId(id: number): Promise<Notificacao | null> {
        const resultado = await this.prisma.notificacao.findUnique({
            where: { id: id },
        });

        if (resultado === null) {
            return null;
        }

        return reconstruirNotificacao(resultado);
    }

    /* ! ========== Buscar notificação aberta da venda ========== */
    public async buscarNotificacaoAbertaPorVendaId(vendaId: number): Promise<Notificacao | null> {
        const resultado = await this.prisma.notificacao.findFirst({
            where: {
                vendaId: vendaId,
                farmaceuticoId: null,
            },
        });

        if (resultado === null) {
            return null;
        }

        return reconstruirNotificacao(resultado);
    }

    /* ! ========== Atender Notificação ========== */
    public async atenderNotificacao(notificacao: Notificacao): Promise<boolean> {
        const resultado = await this.prisma.notificacao.update({
            where: { id: notificacao.getId() },
            data: { farmaceuticoId: notificacao.getFarmaceuticoId() },
        });
        return resultado ? true : false;
    }
}
