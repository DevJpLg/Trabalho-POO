import { Request, Response } from "express";

/**
 * Controller do módulo ItemVenda (classe auxiliar da Venda).
 * Responsável por receber as requisições HTTP e delegar ao service.
 */
export class ItemVendaController {
  // TODO: injetar ItemVendaService

  async criar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listarPorVenda(_req: Request, res: Response): Promise<void> {
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

  async aprovar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
