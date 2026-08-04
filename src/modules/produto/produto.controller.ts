import { Request, Response } from "express";

export class ProdutoController {

  async cadastrarProduto(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listarProdutos(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async buscarProduto(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async editarProduto(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async deletarProduto(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async realizarEntrada(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async realizarBaixa(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async alterarValidade(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async monitorarValidades(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async bloquearProduto(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}