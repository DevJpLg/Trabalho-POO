import { randomInt } from "crypto";

export enum Classificacao {
    LIVRE = "LIVRE",
    CONTROLADO = "CONTROLADO",
    PRESCRITO = "PRESCRITO"
}

export type DadosProduto = {
    nome: string;
    codigoBarras: string;
    principioAtivo: string;
    fabricante: string;
    preco: number;
    descricao?: string | null;
    concentracao?: string | null;
    formulaFarmaceutica?: string | null;
    numeroRegAnvisa?: string | null;
    tarja?: string | null;
    categoria?: string;
    classificacao?: Classificacao;
    quantidadeEstoque?: number;
    localEstoque?: string | null;
    validade?: Date | null;
    classeControle?: string | null;
    retencaoReceita?: boolean;
    validadeReceita?: number | null;
    generico?: boolean;
    lote?: string | null;
    dataFabricacao?: Date | null;
    quantidadeMaxima?: number | null;
};

export default class Produto {
    private id: number;
    private nome: string;
    private codigoBarras: string;
    private descricao: string | null;
    private principioAtivo: string;
    private concentracao: string | null;
    private formulaFarmaceutica: string | null;
    private fabricante: string;
    private numeroRegAnvisa: string | null;
    private tarja: string | null;
    private categoria: string | null;
    private classificacao: Classificacao;
    private quantidadeEstoque: number;
    private localEstoque: string | null;
    private validade: Date | null;
    private classeControle: string | null;
    private retencaoReceita: boolean;
    private validadeReceita: number | null;
    private generico: boolean;
    private lote: string | null;
    private preco: number;
    private dataFabricacao: Date | null;
    private quantidadeMaxima: number | null;

    constructor(id: number, dados: DadosProduto) {
        this.id = id;
        this.nome = dados.nome;
        this.codigoBarras = dados.codigoBarras;
        this.descricao = dados.descricao ?? null;
        this.principioAtivo = dados.principioAtivo;
        this.concentracao = dados.concentracao ?? null;
        this.formulaFarmaceutica = dados.formulaFarmaceutica ?? null;
        this.fabricante = dados.fabricante;
        this.numeroRegAnvisa = dados.numeroRegAnvisa ?? null;
        this.tarja = dados.tarja ?? null;
        this.categoria = dados.categoria ?? null;
        this.classificacao = dados.classificacao ?? Classificacao.LIVRE;
        this.quantidadeEstoque = dados.quantidadeEstoque ?? 0;
        this.localEstoque = dados.localEstoque ?? null;
        this.validade = dados.validade ?? null;
        this.classeControle = dados.classeControle ?? null;
        this.retencaoReceita = dados.retencaoReceita ?? false;
        this.validadeReceita = dados.validadeReceita ?? null;
        this.generico = dados.generico ?? false;
        this.lote = dados.lote ?? null;
        this.preco = dados.preco;
        this.dataFabricacao = dados.dataFabricacao ?? null;
        this.quantidadeMaxima = dados.quantidadeMaxima ?? null;
    }

    public getId(): number { return this.id; }
    public getNome(): string { return this.nome; }
    public getCodigoBarras(): string { return this.codigoBarras; }
    public getDescricao(): string | null { return this.descricao; }
    public getPrincipioAtivo(): string { return this.principioAtivo; }
    public getConcentracao(): string | null { return this.concentracao; }
    public getFormulaFarmaceutica(): string | null { return this.formulaFarmaceutica; }
    public getFabricante(): string { return this.fabricante; }
    public getNumeroRegAnvisa(): string | null { return this.numeroRegAnvisa; }
    public getTarja(): string | null { return this.tarja; }
    public getCategoria(): string | null { return this.categoria; }
    public getClassificacao(): Classificacao { return this.classificacao; }
    public getQuantidadeEstoque(): number { return this.quantidadeEstoque; }
    public getLocalEstoque(): string | null { return this.localEstoque; }
    public getValidade(): Date | null { return this.validade; }
    public getClasseControle(): string | null { return this.classeControle; }
    public getRetencaoReceita(): boolean { return this.retencaoReceita; }
    public getValidadeReceita(): number | null { return this.validadeReceita; }
    public getGenerico(): boolean { return this.generico; }
    public getLote(): string | null { return this.lote; }
    public getPreco(): number { return this.preco; }
    public getDataFabricacao(): Date | null { return this.dataFabricacao; }
    public getQuantidadeMaxima(): number | null { return this.quantidadeMaxima; }

    public static criarProduto(dados: DadosProduto): Produto {
        if(!Produto.validarProduto(dados)) {
            throw new Error("Produto inválido");
        }

        const id = randomInt(1, 1000000);

        const produto = new Produto(id, dados);

        return produto;
    }

    public static validarProduto(dados: DadosProduto): boolean {
        if(dados.nome === "" || dados.codigoBarras === "" || dados.principioAtivo === "" || dados.fabricante === "") {
            return false;
        }

        if(!dados.numeroRegAnvisa || dados.numeroRegAnvisa === "") {
            return false;
        }

        if(!dados.dataFabricacao || !dados.validade) {
            return false;
        }

        if(dados.validade <= dados.dataFabricacao) {
            return false;
        }

        if(dados.preco < 0) {
            return false;
        }

        if(dados.quantidadeEstoque !== undefined && dados.quantidadeEstoque < 0) {
            return false;
        }

        if(dados.quantidadeMaxima !== undefined && dados.quantidadeMaxima !== null && dados.quantidadeMaxima < 0) {
            return false;
        }

        return true;
    }

    public estaVencido(): boolean {
        if(this.validade === null) {
            return false;
        }
        return this.validade.getTime() < Date.now();
    }

    public estaProximoDoVencimento(dias: number = 30): boolean {
        if(this.validade === null || this.estaVencido()) {
            return false;
        }

        const limite = new Date();
        limite.setDate(limite.getDate() + dias);

        return this.validade.getTime() <= limite.getTime();
    }

    public exigePrescricao(): boolean {
        return this.classificacao !== Classificacao.LIVRE;
    }

    public possuiEstoqueSuficiente(qtd: number): boolean {
        return this.quantidadeEstoque >= qtd;
    }
}