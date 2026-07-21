import { Request, Response } from "express";

/**
 * Controller do módulo Usuário.
 * Responsável por receber as requisições HTTP e delegar ao service.
 */
export class UsuarioController {
  // TODO: injetar UsuarioService

  async criar(_req: Request, res: Response): Promise<void> {
    // TODO: implementar criação de usuário
    res.status(501).json({ message: "Não implementado." });
  }

  async listar(_req: Request, res: Response): Promise<void> {
    // TODO: implementar listagem de usuários
    res.status(501).json({ message: "Não implementado." });
  }

  async buscarPorId(_req: Request, res: Response): Promise<void> {
    // TODO: implementar busca por ID
    res.status(501).json({ message: "Não implementado." });
  }

  async atualizar(_req: Request, res: Response): Promise<void> {
    // TODO: implementar atualização de usuário
    res.status(501).json({ message: "Não implementado." });
  }

  async desativar(_req: Request, res: Response): Promise<void> {
    // TODO: implementar desativação (soft delete)
    res.status(501).json({ message: "Não implementado." });
  }
}
