import { randomInt } from "crypto";
import Produto from "../produto";

export type DadosItemVenda = {
    quantidade: number;
    vendaId: number;
    produtoId: number;
    aprovadoFarmaceutico?: boolean;
    preco?: number;
    produto?: Produto | null;
};
export default class ItemVenda {
    private id: number;
    private quantidade: number;
    private preco: number;
    private aprovadoFarmaceutico: boolean;
    private vendaId: number;
    private produtoId: number;
    private produto: Produto | null;

    constructor(id: number, dados: DadosItemVenda) {
        this.id = id;
        this.quantidade = dados.quantidade;
        this.preco = dados.preco ?? 0;
        this.aprovadoFarmaceutico = dados.aprovadoFarmaceutico ?? false;
        this.vendaId = dados.vendaId;
        this.produtoId = dados.produtoId;
        this.produto = dados.produto ?? null;
    }

    public getId(): number { return this.id; }
    public getQuantidade(): number { return this.quantidade; }
    public getPreco(): number { return this.preco; }
    public getAprovadoFarmaceutico(): boolean { return this.aprovadoFarmaceutico; }
    public getVendaId(): number { return this.vendaId; }
    public getProdutoId(): number { return this.produtoId; }
    public getProduto(): Produto | null { return this.produto; }

    public registrarAvaliacao(aprovado: boolean): void {
        this.aprovadoFarmaceutico = aprovado;
    }

    public alterarQuantidade(quantidade: number): void {
        if(!Number.isInteger(quantidade) || quantidade <= 0) {
            throw new Error("Quantidade inválida");
        }
        this.quantidade = quantidade;
    }

    public calcularValorItem(): void {
        if(this.produto === null) {
            throw new Error("Produto do item não carregado");
        }
        this.preco = Math.round(this.produto.getPreco() * this.quantidade * 100) / 100;
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

        if(!Number.isInteger(dados.produtoId) || dados.produtoId <= 0) {
            return false;
        }

        if(dados.produto) {
            if(dados.produto.getId() !== dados.produtoId) {
                return false;
            }

            if(!dados.produto.getIsActive()) {
                return false;
            }

            const validade = dados.produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return false;
            }

            if(dados.produto.getQuantidadeEstoque() < dados.quantidade) {
                return false;
            }
        }

        return true;
    }
}