import { Request, Response } from "express";

/**
 * Controller do módulo Estoque.
 * Responsável por operações de consulta e movimentação de estoque.
 *
 * NOTA DE DESIGN: O módulo Estoque existe separado do Produto porque, apesar
 * da entidade Estoque no diagrama UML ter poucos atributos próprios, ela
 * representa um contexto de negócio distinto: movimentações, alertas de
 * quantidade mínima, entradas e saídas. Manter o módulo isolado facilita a
 * evolução (ex: histórico de movimentações, integração com fornecedores)
 * sem poluir o cadastro de Produto.
 */
export class EstoqueController {
  // TODO: injetar EstoqueService

  async consultarEstoque(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async registrarEntrada(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async registrarSaida(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
