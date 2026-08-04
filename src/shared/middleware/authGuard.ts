import { Request, Response, NextFunction } from "express";
import { InterfaceAutenticacaoService } from "../../modules/usuario/autenticacao/autenticacao.service";

export default class AuthGuard {

  constructor(private autenticacaoService: InterfaceAutenticacaoService) { }

  public async verificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Token não encontrado" });
      return;
    }

    const usuario = await this.autenticacaoService.verificarToken(token);
    if (usuario instanceof Error) {
      res.status(401).json({ message: usuario.message });
      return;
    }

    req.usuario = usuario;
    next();
  }

}
