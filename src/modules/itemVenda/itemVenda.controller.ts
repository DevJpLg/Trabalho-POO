import { Request, Response } from "express";
import { InterfaceItemVendaService } from "./itemVenda.service";
import InterfaceValidacaoItemService from "./validacaoItem/validacaoItem.service";
import ItemVenda from "./index";
import Usuario from "../usuario";

export interface InterfaceItemVendaController {
    adicionarItem(req: Request, res: Response): Promise<void>;
    listarItensVenda(req: Request, res: Response): Promise<void>;
    buscarItemPorId(req: Request, res: Response): Promise<void>;
    atualizarQuantidade(req: Request, res: Response): Promise<void>;
    removerItem(req: Request, res: Response): Promise<void>;
    aprovarItem(req: Request, res: Response): Promise<void>;
    recusarItem(req: Request, res: Response): Promise<void>;
    avaliarVenda(req: Request, res: Response): Promise<void>;
    calcularTotalVenda(req: Request, res: Response): Promise<void>;
}


export default class ItemVendaController implements InterfaceItemVendaController {

    constructor(
        private readonly service: InterfaceItemVendaService,
        private readonly validacaoItemService: InterfaceValidacaoItemService,
    ) {
    }


    private serializarItemVenda(item: ItemVenda) {
        return {
            id: item.getId(),
            quantidade: item.getQuantidade(),
            precoUnitario: item.getPrecoUnitario(),
            precoSubtotal: item.getPrecoSubtotal(),
            exigeAvaliacao: item.getExigeAvaliacao(),
            aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
            vendaId: item.getVendaId(),
            produtoId: item.getProdutoId(),
        };
    }


    async adicionarItem(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const produtoId = Number(req.body.produtoId);
        const quantidade = Number(req.body.quantidade);

        const resultado = await this.service.adicionarItem(
            usuarioLogado as Usuario,
            vendaId,
            produtoId,
            quantidade,
        );

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(201).json({ message: "Item adicionado à venda com sucesso.", id: resultado });
    }


    async listarItensVenda(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const busca = String(req.query.busca ?? "");

        const resultado = await this.service.listarItensVenda(usuarioLogado as Usuario, vendaId, busca);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((item) => this.serializarItemVenda(item)));
    }


    async buscarItemPorId(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const id = Number(req.params.id);

        const resultado = await this.service.buscarItemPorId(usuarioLogado as Usuario, vendaId, id);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(this.serializarItemVenda(resultado));
    }


    async atualizarQuantidade(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const id = Number(req.params.id);
        const quantidade = Number(req.body.quantidade);

        const resultado = await this.service.atualizarQuantidade(
            usuarioLogado as Usuario,
            vendaId,
            id,
            quantidade,
        );

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Quantidade do item atualizada com sucesso." });
    }


    async removerItem(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const id = Number(req.params.id);

        const resultado = await this.service.removerItem(usuarioLogado as Usuario, vendaId, id);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(204).send();
    }


    async aprovarItem(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const id = Number(req.params.id);

        const resultado = await this.validacaoItemService.aprovarItem(usuarioLogado as Usuario, vendaId, id);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Item aprovado com sucesso." });
    }


    async recusarItem(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const id = Number(req.params.id);

        const resultado = await this.validacaoItemService.recusarItem(usuarioLogado as Usuario, vendaId, id);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Item recusado com sucesso." });
    }


    async avaliarVenda(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);
        const aprovado = req.body.aprovado === true || req.body.aprovado === "true";

        const itens = await this.service.listarItensVenda(usuarioLogado as Usuario, vendaId);

        if (itens instanceof Error) {
            res.status(400).json({ message: itens.message });
            return;
        }

        for (const item of itens) {
            const resultado = aprovado
                ? await this.validacaoItemService.aprovarItem(usuarioLogado as Usuario, vendaId, item.getId())
                : await this.validacaoItemService.recusarItem(usuarioLogado as Usuario, vendaId, item.getId());

            if (resultado instanceof Error) {
                res.status(400).json({ message: resultado.message });
                return;
            }
        }

        res.status(200).json({ message: "Avaliação dos itens concluída com sucesso." });
    }


    async calcularTotalVenda(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const vendaId = Number(req.params.vendaId);

        const resultado = await this.service.calcularTotalVenda(usuarioLogado as Usuario, vendaId);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ vendaId: vendaId, total: resultado });
    }
}
