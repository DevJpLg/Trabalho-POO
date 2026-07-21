/**
 * Erro customizado da aplicação.
 * Permite definir status HTTP e mensagem amigável.
 * Implementação completa na próxima etapa.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
