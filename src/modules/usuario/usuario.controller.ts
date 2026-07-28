import { Request, Response } from "express";

/**
 * Controller do módulo Usuário.
 * Responsável por receber as requisições HTTP e delegar ao service.
 */
export class UsuarioController {
  // TODO: injetar UsuarioService

  async login(_req: Request, res: Response): Promise<boolean> {
    return true;
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async cadastrarUsuario(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listarUsuario(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async editarUsuario(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async deletarUsuario(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
