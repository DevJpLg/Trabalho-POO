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
	categoria: string;
	preco: number;
	descricao?: string | null;
	concentracao?: string | null;
	formaFarmaceutica?: string | null;
	numeroRegAnvisa?: string | null;
	tarja?: string | null;
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
	isActive?: boolean;
};

export default class Produto {
	private id: number;
	private nome: string;
	private codigoBarras: string;
	private descricao: string | null;
	private principioAtivo: string;
	private concentracao: string | null;
	private formaFarmaceutica: string | null;
	private fabricante: string;
	private numeroRegAnvisa: string | null;
	private tarja: string | null;
	private categoria: string;
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
	private isActive: boolean;

	constructor(id: number, dados: DadosProduto, isActive: boolean | undefined) {
		this.id = id;
		this.nome = dados.nome;
		this.codigoBarras = dados.codigoBarras;
		this.descricao = dados.descricao ?? null;
		this.principioAtivo = dados.principioAtivo;
		this.concentracao = dados.concentracao ?? null;
		this.formaFarmaceutica = dados.formaFarmaceutica ?? null;
		this.fabricante = dados.fabricante;
		this.numeroRegAnvisa = dados.numeroRegAnvisa ?? null;
		this.tarja = dados.tarja ?? null;
		this.categoria = dados.categoria;
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
		this.isActive = isActive ?? false;
	}

	public getId(): number { return this.id; }
	public getNome(): string { return this.nome; }
	public getCodigoBarras(): string { return this.codigoBarras; }
	public getDescricao(): string | null { return this.descricao; }
	public getPrincipioAtivo(): string { return this.principioAtivo; }
	public getConcentracao(): string | null { return this.concentracao; }
	public getFormaFarmaceutica(): string | null { return this.formaFarmaceutica; }
	public getFabricante(): string { return this.fabricante; }
	public getNumeroRegAnvisa(): string | null { return this.numeroRegAnvisa; }
	public getTarja(): string | null { return this.tarja; }
	public getCategoria(): string { return this.categoria; }
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
	public getIsActive(): boolean { return this.isActive; }

	public atualizarProduto(dados: DadosProduto): void {
		this.nome = dados.nome;
		this.codigoBarras = dados.codigoBarras;
		this.descricao = dados.descricao ?? this.descricao;
		this.principioAtivo = dados.principioAtivo;
		this.concentracao = dados.concentracao ?? this.concentracao;
		this.formaFarmaceutica = dados.formaFarmaceutica ?? this.formaFarmaceutica;
		this.fabricante = dados.fabricante;
		this.numeroRegAnvisa = dados.numeroRegAnvisa ?? this.numeroRegAnvisa;
		this.tarja = dados.tarja ?? this.tarja;
		this.categoria = dados.categoria;
		this.classificacao = dados.classificacao ?? this.classificacao;
		this.quantidadeEstoque = dados.quantidadeEstoque ?? this.quantidadeEstoque;
		this.localEstoque = dados.localEstoque ?? this.localEstoque;
		this.validade = dados.validade ?? this.validade;
		this.classeControle = dados.classeControle ?? this.classeControle;
		this.retencaoReceita = dados.retencaoReceita ?? this.retencaoReceita;
		this.validadeReceita = dados.validadeReceita ?? this.validadeReceita;
		this.generico = dados.generico ?? this.generico;
		this.lote = dados.lote ?? this.lote;
		this.preco = dados.preco;
		this.dataFabricacao = dados.dataFabricacao ?? this.dataFabricacao;
		this.quantidadeMaxima = dados.quantidadeMaxima ?? this.quantidadeMaxima;
		this.isActive = dados.isActive ?? this.isActive;
	}

	public static criarProduto(dados: DadosProduto): Produto | Error {
		if(!dados.nome) 										{ return new Error("Nome inválido"); }
		if(!dados.codigoBarras)									{ return new Error("Código de barras inválido"); }
		if(!dados.fabricante)									{ return new Error("Fabricante inválido"); }
		if(!dados.categoria)									{ return new Error("Categoria inválida"); }
		if (!dados.dataFabricacao)								{ return new Error("Data de fabricação inválida"); }
		if (!dados.validade)									{ return new Error("Data de validade inválida"); }
		if (dados.validade < dados.dataFabricacao)				{ return new Error("Data de validade menor que a data de fabricação"); }
		if (!Number.isFinite(dados.preco) || dados.preco < 0)	{ return new Error("Preço inválido"); }
		const estoque = dados.quantidadeEstoque ?? 0;
		if (!Number.isFinite(estoque) || estoque < 0)			{ return new Error("Quantidade de estoque inválida"); }

		const id = randomInt(1, 1000000);
		return new Produto(id, dados, true);
	}

	public static rebuildProduto(id: number, dados: DadosProduto, isActive: boolean): Produto {
		const produto = new Produto(id, dados, isActive);
		return produto;
	}

	public editarProduto(dados: DadosProduto): Produto | Error {
		if(!dados.nome) 										{ return new Error("Nome inválido"); }
		if(!dados.codigoBarras)									{ return new Error("Código de barras inválido"); }
		if(!dados.fabricante)									{ return new Error("Fabricante inválido"); }
		if(!dados.categoria)									{ return new Error("Categoria inválida"); }
		if (!dados.dataFabricacao)								{ return new Error("Data de fabricação inválida"); }
		if (!dados.validade)									{ return new Error("Data de validade inválida"); }
		if (dados.validade < dados.dataFabricacao)				{ return new Error("Data de validade menor que a data de fabricação"); }
		if (!Number.isFinite(dados.preco) || dados.preco < 0)	{ return new Error("Preço inválido"); }
		const estoque = dados.quantidadeEstoque ?? 0;
		if (!Number.isFinite(estoque) || estoque < 0)			{ return new Error("Quantidade de estoque inválida"); }

		this.atualizarProduto(dados);
		return this;
	}

}