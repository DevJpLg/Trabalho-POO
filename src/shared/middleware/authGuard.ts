import { Request, Response, NextFunction } from "express";

/**
 * Middleware de autenticação — verifica token JWT.
 * Implementação na etapa de autenticação.
 */
export function authGuard(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // TODO: validar JWT e popular req.user
  next();
}
