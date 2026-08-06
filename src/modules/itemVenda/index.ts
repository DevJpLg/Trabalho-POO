import { randomInt } from "crypto";

export type DadosItemVenda = {
    quantidade: number;
    vendaId: number;
    produtoId: number;
    aprovadoFarmaceutico?: boolean;
};
export default class ItemVenda {
    private id: number;
    private quantidade: number;
    private aprovadoFarmaceutico: boolean;
    private vendaId: number;
    private produtoId: number;

    constructor(id: number, dados: DadosItemVenda) {
        this.id = id;
        this.quantidade = dados.quantidade;
        this.aprovadoFarmaceutico = dados.aprovadoFarmaceutico ?? false;
        this.vendaId = dados.vendaId;
        this.produtoId = dados.produtoId;
    }

    public getId(): number { return this.id; }
    public getQuantidade(): number { return this.quantidade; }
    public getAprovadoFarmaceutico(): boolean { return this.aprovadoFarmaceutico; }
    public getVendaId(): number { return this.vendaId; }
    public getProdutoId(): number { return this.produtoId; }

    public aprovar(): void {
        this.aprovadoFarmaceutico = true;
    }

    public recusar(): void {
        this.aprovadoFarmaceutico = false;
    }

    public alterarQuantidade(quantidade: number): void {
        if(!Number.isInteger(quantidade) || quantidade <= 0) {
            throw new Error("Quantidade inválida");
        }
        this.quantidade = quantidade;
    }

    public calcularValorItem(precoUnitario: number): number {
        return Math.round(this.quantidade * precoUnitario * 100) / 100;
    }

    public static criarItemVenda(dados: DadosItemVenda): ItemVenda {
        if(!ItemVenda.validarItemVenda(dados)) {
            throw new Error("Item de venda inválido");
        }

        const id = randomInt(1, 1000000);

        const itemVenda = new ItemVenda(id, dados);

        return itemVenda;
    }

    public static validarItemVenda(dados: DadosItemVenda): boolean {
        if(!Number.isInteger(dados.quantidade) || dados.quantidade <= 0) {
            return false;
        }

        if(!Number.isInteger(dados.vendaId) || dados.vendaId <= 0) {
            return false;
        }

        if(!Number.isInteger(dados.produtoId) || dados.produtoId <= 0) {
            return false;
        }

        return true;
    }
}