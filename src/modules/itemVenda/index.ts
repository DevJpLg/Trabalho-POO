import { randomInt } from "crypto";
import Produto from "../produto";


export default class ItemVenda {
    private id: number;
    private quantidade: number;
    private precoUnitario: number;
    private precoSubtotal: number;
    private exigeAvaliacao: boolean;
    private aprovadoFarmaceutico: boolean;
    private produtoId: number;
    private vendaId: number;
    
    constructor(id: number, quantidade: number, precoUnitario: number, precoSubtotal: number, aprovadoFarmaceutico: boolean, vendaId: number, produtoId: number, exigeAvaliacao: boolean) {
        this.id = id;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.precoSubtotal = precoSubtotal;
        this.exigeAvaliacao = exigeAvaliacao;
        this.aprovadoFarmaceutico = aprovadoFarmaceutico;
        this.vendaId = vendaId;
        this.produtoId = produtoId;
    }

    public getId(): number { return this.id; }
    public getQuantidade(): number { return this.quantidade; }
    public getPrecoUnitario(): number { return this.precoUnitario; }
    public getPrecoSubtotal(): number { return this.precoSubtotal; }
    public getExigeAvaliacao(): boolean { return this.exigeAvaliacao; }
    public getAprovadoFarmaceutico(): boolean { return this.aprovadoFarmaceutico; }
    public getVendaId(): number { return this.vendaId; }
    public getProdutoId(): number { return this.produtoId; }


    // Funciona para Aprovar ou Reprovar (Mesma regra de negócio)
    public registrarAvaliacao(aprovado: boolean): void {
        this.aprovadoFarmaceutico = aprovado;
    }


    // Funciona para aumentar ou diminuir (Mesma regra de negócio)
    public alterarQuantidade(quantidade: number): void {
        this.quantidade = quantidade;
        this.precoSubtotal = ItemVenda.calcularSubtotal(this.precoUnitario, quantidade);
    }


    //Em observação: Preciso saber se usa o precoUnitario ou o Produto
    public static calcularSubtotal(precoUnitario: number, quantidade: number): number {
        return Math.round(precoUnitario * quantidade * 100) / 100;
    }


    public static criarItemVenda(quantidade: number, precoUnitario: number, exigeAvaliacao: boolean, vendaId: number, produtoId: number): ItemVenda {
        if(quantidade === null || quantidade === undefined) {
            throw new Error("Quantidade inválida");
        }
        
        if(precoUnitario === null || precoUnitario === undefined) {
            throw new Error("Preço unitário inválido");
        }

        if(vendaId === null || vendaId === undefined) {
            throw new Error("Venda inválida");
        }

        if(produtoId === null || produtoId === undefined) {
            throw new Error("Produto inválido");
        }

        const subtotal = ItemVenda.calcularSubtotal(precoUnitario, quantidade);
        
        const id = randomInt(1, 1000000);
        
        return new ItemVenda(id, quantidade, precoUnitario, subtotal, false, vendaId, produtoId, exigeAvaliacao);
    }


    public static rebuildItemVenda(id: number, quantidade: number, precoUnitario: number, exigeAvaliacao: boolean, aprovadoFarmaceutico: boolean, vendaId: number, produtoId: number): ItemVenda {
        const precoSubtotal = ItemVenda.calcularSubtotal(precoUnitario, quantidade);
        return new ItemVenda(id, quantidade, precoUnitario, precoSubtotal, aprovadoFarmaceutico, vendaId, produtoId, exigeAvaliacao);
    }

}