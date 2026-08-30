import crypto from "crypto";

export enum TipoNotificacao {
    VENDA_PRESCRITA = "VENDA_PRESCRITA",
}

export default class Notificacao {
    private id: number;
    private tipo: TipoNotificacao;
    private vendaId: number;
    private dataHora: Date;
    private resolvida: boolean;

    constructor(id: number, tipo: TipoNotificacao, vendaId: number, dataHora: Date, resolvida: boolean) {
        this.id = id;
        this.tipo = tipo;
        this.vendaId = vendaId;
        this.dataHora = dataHora;
        this.resolvida = resolvida;
    }

    public getId(): number { return this.id; }
    public getTipo(): TipoNotificacao { return this.tipo; }
    public getVendaId(): number { return this.vendaId; }
    public getDataHora(): Date { return this.dataHora; }
    public getResolvida(): boolean { return this.resolvida; }

    public resolver(): void {
        if (this.resolvida) {
            throw new Error("Notificação já foi atendida");
        }
        this.resolvida = true;
    }

    public static criarNotificacao(vendaId: number): Notificacao {
        if (!Number.isInteger(vendaId) || vendaId <= 0) {
            throw new Error("Venda inválida");
        }

        const id = crypto.randomInt(1, 1000000);
        return new Notificacao(id, TipoNotificacao.VENDA_PRESCRITA, vendaId, new Date(), false);
    }

    public static rebuildNotificacao(id: number, tipo: TipoNotificacao, vendaId: number, dataHora: Date, resolvida: boolean): Notificacao {
        return new Notificacao(id, tipo, vendaId, dataHora, resolvida);
    }
}
