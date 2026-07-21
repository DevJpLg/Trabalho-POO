import { Request, Response, NextFunction } from "express";

/**
 * Middleware global de tratamento de erros.
 * Implementação na próxima etapa.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: implementar tratamento de erros padronizado (AppError, status codes, logging)
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
