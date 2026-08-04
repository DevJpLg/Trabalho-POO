import { Request, Response } from "express";
import InterfaceProdutoService from "./produto.service";
import Produto from "../produto";
import ProdutoMapper from "./produto.mapper";

export interface InterfaceProdutoController {
  cadastrarProduto(req: Request, res: Response): Promise<void>;
  listarProdutos(req: Request, res: Response): Promise<void>;
  buscarProduto(req: Request, res: Response): Promise<void>;
  editarProduto(req: Request, res: Response): Promise<void>;
  deletarProduto(req: Request, res: Response): Promise<void>;
  realizarEntrada(req: Request, res: Response): Promise<void>;
  realizarBaixa(req: Request, res: Response): Promise<void>;
  alterarValidade(req: Request, res: Response): Promise<void>;
  monitorarValidades(req: Request, res: Response): Promise<void>;
  bloquearProduto(req: Request, res: Response): Promise<void>;
}

export default class ProdutoController implements InterfaceProdutoController {

  constructor(private readonly service: InterfaceProdutoService, private readonly mapper: ProdutoMapper) {
  }


  private serializarProduto(produto: Produto) {
    return {
      id: produto.getId(),
      nome: produto.getNome(),
      codigoBarras: produto.getCodigoBarras(),
      descricao: produto.getDescricao(),
      principioAtivo: produto.getPrincipioAtivo(),
      concentracao: produto.getConcentracao(),
      formulaFarmaceutica: produto.getFormulaFarmaceutica(),
      fabricante: produto.getFabricante(),
      numeroRegAnvisa: produto.getNumeroRegAnvisa(),
      tarja: produto.getTarja(),
      categoria: produto.getCategoria(),
      classificacao: produto.getClassificacao(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      localEstoque: produto.getLocalEstoque(),
      validade: produto.getValidade(),
      classeControle: produto.getClasseControle(),
      retencaoReceita: produto.getRetencaoReceita(),
      validadeReceita: produto.getValidadeReceita(),
      generico: produto.getGenerico(),
      lote: produto.getLote(),
      preco: produto.getPreco(),
      dataFabricacao: produto.getDataFabricacao(),
      quantidadeMaxima: produto.getQuantidadeMaxima(),
      isActive: produto.getIsActive(),
    };
  }

  async cadastrarProduto(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const dados = await this.mapper.EstruturarDadosProduto(req.body);
    const resultado = await this.service.cadastrarProduto(usuarioLogado, dados);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(201).json({ message: "Produto cadastrado com sucesso." });
  }


  async listarProdutos(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const busca = String(req.query.busca ?? "");
    const resultado = await this.service.listarProdutos(usuarioLogado, busca);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
  }


  async buscarProduto(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const busca = String(req.query.busca ?? "");
    const resultado = await this.service.buscarProduto(usuarioLogado, busca);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
  }


  async editarProduto(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const dados = await this.mapper.EstruturarDadosProduto(req.body);
    const resultado = await this.service.editarProduto(usuarioLogado, id, dados);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Produto atualizado com sucesso." });
  }


  async deletarProduto(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.deletarProduto(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(204).send();
  }

  async realizarEntrada(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const qtd = Number(req.body.qtd);
    const resultado = await this.service.realizarEntrada(usuarioLogado, id, qtd);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
  }

  async realizarBaixa(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const qtd = Number(req.body.qtd);
    const resultado = await this.service.realizarBaixa(usuarioLogado, id, qtd);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Baixa realizada com sucesso." });
  }


  async alterarValidade(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const data = new Date(req.body.data);
    const resultado = await this.service.alterarValidade(usuarioLogado, id, data);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Validade alterada com sucesso." });
  }


  async monitorarValidades(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const resultado = await this.service.monitorarValidades(usuarioLogado);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
  }

  async bloquearProduto(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
    if (!usuarioLogado) {
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.bloquearProduto(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Produto bloqueado com sucesso." });
  }
}
