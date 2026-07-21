import { Request, Response } from "express";

/**
 * Controller do módulo Notificação.
 * Responsável pelas notificações internas do sistema.
 */
export class NotificacaoController {
  // TODO: injetar NotificacaoService

  async listar(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async marcarComoLida(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async contarNaoLidas(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
