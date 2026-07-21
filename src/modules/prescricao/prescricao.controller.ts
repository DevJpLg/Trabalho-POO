import { Request, Response } from "express";

/**
 * Controller do módulo Prescrição.
 * Responsável pelas operações de prescrições/receitas médicas.
 */
export class PrescricaoController {
  // TODO: injetar PrescricaoService

  async registrar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async buscarPorId(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async avaliar(_req: Request, res: Response): Promise<void> {
    // Farmacêutico aprova ou rejeita a prescrição
    res.status(501).json({ message: "Não implementado." });
  }
}
