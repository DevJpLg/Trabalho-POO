import { Request, Response } from "express";
import { InterfaceItemVendaService } from "./itemVenda.service";
import ItemVenda from "./index";
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

  constructor(private readonly service: InterfaceItemVendaService) {
  }

  private serializarItemVenda(item: ItemVenda) {
    return {
      id: item.getId(),
      quantidade: item.getQuantidade(),
      aprovadoFarmaceutico: item.getAprovadoFarmaceutico(),
      vendaId: item.getVendaId(),
      produtoId: item.getProdutoId(),
    };
  }

  async adicionarItem(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const vendaId = Number(req.params.vendaId);
    const produtoId = Number(req.body.produtoId);
    const quantidade = Number(req.body.quantidade);

    const resultado = await this.service.adicionarItem(usuarioLogado, vendaId, produtoId, quantidade);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(201).json({ message: "Item adicionado à venda com sucesso." });
  }

  async listarItensVenda(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const vendaId = Number(req.params.vendaId);
    const resultado = await this.service.listarItensVenda(usuarioLogado, vendaId);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json(resultado.map((item) => this.serializarItemVenda(item)));
  }

  async buscarItemPorId(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.buscarItemPorId(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json(this.serializarItemVenda(resultado));
  }

  async atualizarQuantidade(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const id = Number(req.params.id);
    const quantidade = Number(req.body.quantidade);

    const resultado = await this.service.atualizarQuantidade(usuarioLogado, id, quantidade);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Quantidade do item atualizada com sucesso." });
  }

  async removerItem(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.removerItem(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(204).send();
  }

  async aprovarItem(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.aprovarItem(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Item aprovado com sucesso." });
  }

  async recusarItem(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const id = Number(req.params.id);
    const resultado = await this.service.recusarItem(usuarioLogado, id);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Item recusado e removido da venda." });
  }

  async avaliarVenda(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const vendaId = Number(req.params.vendaId);
    const aprovado = req.body.aprovado === true || req.body.aprovado === "true";

    const resultado = await this.service.avaliarVenda(usuarioLogado, vendaId, aprovado);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Avaliação dos itens concluída com sucesso." });
  }

  async calcularTotalVenda(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    if (!usuarioLogado) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    const vendaId = Number(req.params.vendaId);
    const resultado = await this.service.calcularTotalVenda(usuarioLogado, vendaId);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ vendaId: vendaId, total: resultado });
  }
}
