import crypto from "crypto";

export default class Notificacao {
    private id: number;
    private vendaId: number;
    private dataHora: Date;
    private farmaceuticoId: number | null;

    constructor(id: number, vendaId: number, dataHora: Date, farmaceuticoId: number | null) {
        this.id = id;
        this.vendaId = vendaId;
        this.dataHora = dataHora;
        this.farmaceuticoId = farmaceuticoId;
    }

    public getId(): number { return this.id; }
    public getVendaId(): number { return this.vendaId; }
    public getDataHora(): Date { return this.dataHora; }
    public getFarmaceuticoId(): number | null { return this.farmaceuticoId; }

    public atender(farmaceuticoId: number): void {
        if (this.farmaceuticoId !== null) {
            throw new Error("Notificação já foi atendida");
        }
        if (!Number.isInteger(farmaceuticoId) || farmaceuticoId <= 0) {
            throw new Error("Farmacêutico inválido");
        }
        this.farmaceuticoId = farmaceuticoId;
    }

    public static criarNotificacao(vendaId: number): Notificacao {
        if (!Number.isInteger(vendaId) || vendaId <= 0) {
            throw new Error("Venda inválida");
        }

        const id = crypto.randomInt(1, 1000000);
        return new Notificacao(id, vendaId, new Date(), null);
    }

    public static rebuildNotificacao(id: number, vendaId: number, dataHora: Date, farmaceuticoId: number | null): Notificacao {
        return new Notificacao(id, vendaId, dataHora, farmaceuticoId);
    }
}
