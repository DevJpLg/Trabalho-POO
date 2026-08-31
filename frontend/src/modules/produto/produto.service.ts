import { listarTolerante } from "../../shared/http/getErrorMessage";
import { ApiError } from "../../shared/http/HttpClient";
import type { MessageResponse, ProdutoDTO, ProdutoInput } from "../../shared/types/api";
import { produtoParaInput } from "./produto.mapper";
import type { InterfaceProdutoRepository } from "./produto.repository";

export interface InterfaceProdutoService {
  listar(busca?: string): Promise<ProdutoDTO[]>;
  buscarVendaveis(busca?: string): Promise<ProdutoDTO[]>;
  listarValidades(dias?: number): Promise<ProdutoDTO[]>;
  /** Escolhe entre catálogo completo e catálogo vendável conforme o perfil. */
  listarPorPerfil(catalogoCompleto: boolean, busca?: string): Promise<ProdutoDTO[]>;
  cadastrar(dados: ProdutoInput): Promise<MessageResponse>;
  editar(id: number, dados: ProdutoInput): Promise<MessageResponse>;
  deletar(produto: ProdutoDTO): Promise<MessageResponse>;
  entrada(id: number, qtd: number): Promise<MessageResponse>;
  /**
   * `PATCH /produtos/:id/baixa` só autoriza ATENDENTE/CAIXA. O botão da tela de
   * produtos é do GERENTE, então a baixa dele segue por `PUT /produtos/:id`.
   */
  baixa(produto: ProdutoDTO, qtd: number): Promise<MessageResponse>;
  alterarValidade(id: number, novaValidade: string): Promise<MessageResponse>;
  bloquear(id: number): Promise<MessageResponse>;
  desbloquear(id: number): Promise<MessageResponse>;
}

function exigirQuantidade(qtd: number, rotulo: string): void {
  if (!Number.isInteger(qtd) || qtd <= 0) {
    throw new Error(`Quantidade de ${rotulo} deve ser um inteiro maior que zero.`);
  }
}

function textoOuNulo(valor?: string | null): string | null {
  if (valor == null) return null;
  const texto = valor.trim();
  return texto === "" ? null : texto;
}

function isoOuNulo(valor?: string | null): string | null {
  const texto = textoOuNulo(valor);
  if (!texto) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    throw new Error("Data inválida. Use o calendário ou o formato DD/MM/AAAA.");
  }
  const data = new Date(`${texto.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) {
    throw new Error("Data inválida.");
  }
  return texto.slice(0, 10);
}

/** Alinha o payload ao que o controller lê e evita string vazia no lugar de null. */
function payloadProduto(dados: ProdutoInput): ProdutoInput {
  const classificacao = dados.classificacao ?? "LIVRE";
  const dataFabricacao = isoOuNulo(dados.dataFabricacao);
  const validade = isoOuNulo(dados.validade);

  if (!dados.nome?.trim()) throw new Error("Nome inválido");
  if (!dados.codigoBarras?.trim()) throw new Error("Código de barras inválido");
  if (!dados.fabricante?.trim()) throw new Error("Fabricante inválido");
  if (!dados.categoria?.trim()) throw new Error("Categoria inválida");
  if (!dataFabricacao) throw new Error("Data de fabricação inválida");
  if (!validade) throw new Error("Data de validade inválida");
  if (validade < dataFabricacao) {
    throw new Error("Data de validade menor que a data de fabricação");
  }
  if (!Number.isFinite(dados.preco) || dados.preco < 0) throw new Error("Preço inválido");

  if (classificacao !== "LIVRE") {
    if (!textoOuNulo(dados.principioAtivo)) throw new Error("Princípio ativo inválido");
    if (!textoOuNulo(dados.concentracao)) throw new Error("Concentração inválida");
    if (!textoOuNulo(dados.formaFarmaceutica)) throw new Error("Forma farmacêutica inválida");
    if (!textoOuNulo(dados.numeroRegAnvisa)) throw new Error("Número de registro ANVISA inválido");
    if (!textoOuNulo(dados.tarja)) throw new Error("Tarja inválida");
    if (!textoOuNulo(dados.classeControle)) throw new Error("Classe de controle inválida");
    if (dados.validadeReceita == null || dados.validadeReceita <= 0) {
      throw new Error("Validade de receita inválida");
    }
    if (dados.quantidadeMaxima == null || dados.quantidadeMaxima <= 0) {
      throw new Error("Quantidade máxima inválida");
    }
  }

  return {
    ...dados,
    nome: dados.nome.trim(),
    codigoBarras: dados.codigoBarras.trim(),
    principioAtivo: dados.principioAtivo.trim(),
    fabricante: dados.fabricante.trim(),
    categoria: dados.categoria.trim(),
    classificacao,
    descricao: textoOuNulo(dados.descricao),
    concentracao: textoOuNulo(dados.concentracao),
    formaFarmaceutica: textoOuNulo(dados.formaFarmaceutica),
    numeroRegAnvisa: textoOuNulo(dados.numeroRegAnvisa),
    tarja: textoOuNulo(dados.tarja),
    localEstoque: textoOuNulo(dados.localEstoque),
    classeControle: textoOuNulo(dados.classeControle),
    lote: textoOuNulo(dados.lote),
    validade,
    dataFabricacao,
    retencaoReceita: Boolean(dados.retencaoReceita),
    generico: Boolean(dados.generico),
    isActive: dados.isActive ?? true,
  };
}

export class ProdutoService implements InterfaceProdutoService {
  constructor(private readonly repository: InterfaceProdutoRepository) {}

  listar(busca = ""): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.listar(busca));
  }

  buscarVendaveis(busca = ""): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.buscarVendaveis(busca));
  }

  listarValidades(dias?: number): Promise<ProdutoDTO[]> {
    return listarTolerante(() => this.repository.listarValidades(dias));
  }

  listarPorPerfil(catalogoCompleto: boolean, busca = ""): Promise<ProdutoDTO[]> {
    return catalogoCompleto ? this.listar(busca) : this.buscarVendaveis(busca);
  }

  cadastrar(dados: ProdutoInput): Promise<MessageResponse> {
    return this.repository.cadastrar(payloadProduto(dados));
  }

  editar(id: number, dados: ProdutoInput): Promise<MessageResponse> {
    return this.repository.editar(id, payloadProduto(dados));
  }

  /**
   * DELETE responde 204 e quebra se o produto já entrou em alguma venda (FK).
   * Sem alterar o backend: se a exclusão falhar, inativamos via PUT (gerente
   * pode editar; bloquear é só do farmacêutico). Se o DELETE tiver funcionado
   * e o proxy só tiver perdido o 204, o PUT vem "não encontrado" — sucesso.
   */
  async deletar(produto: ProdutoDTO): Promise<MessageResponse> {
    try {
      await this.repository.deletar(produto.id);
      return { message: "Produto removido." };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) throw err;

      try {
        await this.repository.editar(
          produto.id,
          payloadProduto({ ...produtoParaInput(produto), isActive: false }),
        );
        return {
          message:
            "O produto não pôde ser excluído porque já foi usado em vendas. Ele foi inativado no catálogo.",
        };
      } catch (fallbackErr) {
        if (fallbackErr instanceof ApiError && /n[aã]o encontrado/i.test(fallbackErr.message)) {
          return { message: "Produto removido." };
        }
        throw err;
      }
    }
  }

  entrada(id: number, qtd: number): Promise<MessageResponse> {
    exigirQuantidade(qtd, "entrada");
    return this.repository.entrada(id, qtd);
  }

  baixa(produto: ProdutoDTO, qtd: number): Promise<MessageResponse> {
    exigirQuantidade(qtd, "baixa");
    if (!produto.isActive) {
      throw new Error("Produto bloqueado não pode sofrer baixa de estoque.");
    }
    if (produto.quantidadeEstoque < qtd) {
      throw new Error("Quantidade em estoque insuficiente para a baixa.");
    }
    return this.repository.editar(produto.id, {
      ...payloadProduto(produtoParaInput(produto)),
      quantidadeEstoque: produto.quantidadeEstoque - qtd,
    });
  }

  alterarValidade(id: number, novaValidade: string): Promise<MessageResponse> {
    const data = isoOuNulo(novaValidade);
    if (!data) throw new Error("Data de validade inválida.");
    return this.repository.alterarValidade(id, data);
  }

  bloquear(id: number): Promise<MessageResponse> {
    return this.repository.bloquear(id);
  }

  desbloquear(id: number): Promise<MessageResponse> {
    return this.repository.desbloquear(id);
  }
}
