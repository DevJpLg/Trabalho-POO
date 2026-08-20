import { Request, Response } from "express";
import { VendaService } from "./venda.service";
import Venda, { StatusVenda } from "./index";

export class VendaController {
  constructor(private readonly service: VendaService) {}

  private serializarVenda(venda: Venda) {
    return {
      id: venda.getId(),
      dataHora: venda.getDataHora(),
      status: venda.getStatus(),
      idAtendente: venda.getIdAtendente(),
      idFarmaceutico: venda.getIdFarmaceutico(),
      idCaixa: venda.getIdCaixa(),
    };
  }

  async iniciarVenda(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async adicionarItem(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async removerItem(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async finalizarVenda(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async cancelarVenda(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const resultado = await this.service.listarVendas(String(req.query.busca ?? ""));

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    const status = typeof req.query.status === "string" ? req.query.status : "";
    const vendas =
      status && Object.values(StatusVenda).includes(status as StatusVenda)
        ? resultado.filter((venda) => venda.getStatus() === status)
        : resultado;

    res.status(200).json(vendas.map((venda) => this.serializarVenda(venda)));
  }

  async buscarPorId(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
