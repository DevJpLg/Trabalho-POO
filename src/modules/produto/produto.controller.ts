import { Request, Response } from "express";
import InterfaceProdutoService from "./produto.service";
import Produto, { DadosProduto } from "./index";
import Usuario from "../usuario";
import ItemVenda from "../itemVenda";

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
    desbloquearProduto(req: Request, res: Response): Promise<void>;
}


export default class ProdutoController implements InterfaceProdutoController {

    constructor(private service: InterfaceProdutoService) {}


    //Recebe um produto e retorna um JSON, para enviar no response
    private serializarProduto(produto: Produto) {
        return {
            id: produto.getId(),
            nome: produto.getNome(),
            codigoBarras: produto.getCodigoBarras(),
            descricao: produto.getDescricao(),
            principioAtivo: produto.getPrincipioAtivo(),
            concentracao: produto.getConcentracao(),
            formaFarmaceutica: produto.getFormaFarmaceutica(),
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


    //Recebe um JSON e retorna um DadosProduto, para ser usado no service
    private extrairDadosProduto(body: Request["body"]): DadosProduto {
        return {
            nome: body.nome,
            codigoBarras: body.codigoBarras,
            principioAtivo: body.principioAtivo,
            fabricante: body.fabricante,
            categoria: body.categoria,
            preco: Number(body.preco),
            descricao: body.descricao,
            concentracao: body.concentracao,
            formaFarmaceutica: body.formaFarmaceutica,
            numeroRegAnvisa: body.numeroRegAnvisa,
            tarja: body.tarja,
            classificacao: body.classificacao,
            quantidadeEstoque: body.quantidadeEstoque !== undefined && body.quantidadeEstoque !== null
                ? Number(body.quantidadeEstoque)
                : undefined,
            localEstoque: body.localEstoque,
            validade: body.validade ? new Date(body.validade) : null,
            classeControle: body.classeControle,
            retencaoReceita: body.retencaoReceita,
            validadeReceita: body.validadeReceita !== undefined && body.validadeReceita !== null
                ? Number(body.validadeReceita)
                : null,
            generico: body.generico,
            lote: body.lote,
            dataFabricacao: body.dataFabricacao ? new Date(body.dataFabricacao) : null,
            quantidadeMaxima: body.quantidadeMaxima !== undefined && body.quantidadeMaxima !== null
                ? Number(body.quantidadeMaxima)
                : null,
            isActive: body.isActive,
        };
    }


    /* ! ========== Cadastrar Produto ========== */
    async cadastrarProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const dados = this.extrairDadosProduto(req.body);

        const resultado = await this.service.cadastrarProduto(usuarioLogado as Usuario, dados);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(201).json({ message: "Produto cadastrado com sucesso." });
    }


    /* ! ========== Listar Produtos ========== */
    async listarProdutos(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario;
        const busca = String(req.query.busca ?? "");

        const resultado = await this.service.listarProdutos(usuarioLogado as Usuario, busca);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
    }


    /* ! ========== Buscar Produto ========== */
    async buscarProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const busca = String(req.query.busca ?? "");

        const resultado = await this.service.buscarProduto(usuarioLogado as Usuario, busca);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
    }


    /* ! ========== Editar Produto ========== */
    async editarProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);
        const dados = this.extrairDadosProduto(req.body);

        const resultado = await this.service.editarProduto(usuarioLogado as Usuario, id, dados);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Produto atualizado com sucesso." });
    }


    /* ! ========== Deletar Produto ========== */
    async deletarProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);

        const resultado = await this.service.deletarProduto(usuarioLogado as Usuario, id);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(204).json({ message: "Produto deletado com sucesso." });
    }


    /* ! ========== Realizar Entrada ========== */
    async realizarEntrada(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);
        const qtd = Number(req.body.qtd);

        const resultado = await this.service.realizarEntrada(usuarioLogado as Usuario, id, qtd);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Entrada realizada com sucesso." });
    }


    /* ! ========== Realizar Baixa ========== */
    async realizarBaixa(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);
        const qtd = Number(req.body.qtd);

        const item = ItemVenda.rebuildItemVenda(0, qtd, 0, false, false, 0, id);
        const resultado = await this.service.realizarBaixa(usuarioLogado as Usuario, [item]);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Baixa realizada com sucesso." });
    }


    /* ! ========== Alterar Validade ========== */
    async alterarValidade(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);
        const data = new Date(req.body.data);

        const resultado = await this.service.alterarValidade(usuarioLogado as Usuario, id, data);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Validade alterada com sucesso." });
    }


    /* ! ========== Monitorar Validades ========== */
    async monitorarValidades(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const dias = req.query.dias !== undefined ? Number(req.query.dias) : undefined;

        const resultado = await this.service.monitorarValidades(usuarioLogado as Usuario, dias);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((produto) => this.serializarProduto(produto)));
    }


    /* ! ========== Bloquear Produto ========== */
    async bloquearProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);

        const resultado = await this.service.bloquearProduto(usuarioLogado as Usuario, id);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Produto bloqueado com sucesso." });
    }


    /* ! ========== Desbloquear Produto ========== */
    async desbloquearProduto(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);

        const resultado = await this.service.desbloquearProduto(usuarioLogado as Usuario, id);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Produto desbloqueado com sucesso." });
    }
}
