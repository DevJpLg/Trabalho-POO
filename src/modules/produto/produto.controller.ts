import { Request, Response } from "express";

/**
 * Controller do módulo Produto.
 * Responsável por receber as requisições HTTP e delegar ao service.
 */
export class ProdutoController {
  // TODO: injetar ProdutoService

  async criar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async buscarPorId(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async atualizar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async remover(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
