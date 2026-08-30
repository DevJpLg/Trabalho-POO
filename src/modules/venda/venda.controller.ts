import { Request, Response } from "express";
import InterfaceVendaService from "./venda.service";
import Venda from "./index";
import Usuario from "../usuario";

export default interface InterfaceVendaController {
  registrarVenda(req: Request, res: Response): Promise<void>;
  listarVendas(req: Request, res: Response): Promise<void>;
  buscarPorId(req: Request, res: Response): Promise<void>;
  finalizarVenda(req: Request, res: Response): Promise<void>;
  cancelarVenda(req: Request, res: Response): Promise<void>;
}

export class VendaController implements InterfaceVendaController {
  private readonly service: InterfaceVendaService;

  constructor(service: InterfaceVendaService) {
    this.service = service;
  }

  // Recebe uma venda e retorna um JSON, para enviar no response
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

  // Recebe um JSON e retorna os dados tipados, para serem usados no service
  private extrairDadosVenda(body: Request["body"]) {
    let idAtendente: number | null = null;
    if (body.idAtendente !== undefined && body.idAtendente !== null && body.idAtendente !== "") {
      idAtendente = Number(body.idAtendente);
    }

    let idFarmaceutico: number | null = null;
    if (body.idFarmaceutico !== undefined && body.idFarmaceutico !== null && body.idFarmaceutico !== "") {
      idFarmaceutico = Number(body.idFarmaceutico);
    }

    let idCaixa: number | null = null;
    if (body.idCaixa !== undefined && body.idCaixa !== null && body.idCaixa !== "") {
      idCaixa = Number(body.idCaixa);
    }

    return { idAtendente, idFarmaceutico, idCaixa };
  }


  /* ! ========== Registrar Venda ========== */
  async registrarVenda(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    const { idAtendente, idFarmaceutico, idCaixa } = this.extrairDadosVenda(req.body);

    const resultado = await this.service.registrarVenda(usuarioLogado as Usuario, idAtendente, idFarmaceutico, idCaixa);

    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(201).json({ message: "Venda registrada com sucesso." });
  }


  /* ! ========== Listar Vendas ========== */
  async listarVendas(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    const busca = String(req.query.busca ?? "");

    const resultado = await this.service.listarVendas(busca, usuarioLogado as Usuario);
    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json(resultado.map((venda) => this.serializarVenda(venda)));
  }


  /* ! ========== Buscar Venda por ID ========== */
  async buscarPorId(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }


  /* ! ========== Finalizar Venda ========== */
  async finalizarVenda(req: Request, res: Response): Promise<void> {
    const usuarioLogado = req.usuario;
    const id = Number(req.params.id);

    const resultado = await this.service.finalizarVenda(usuarioLogado as Usuario, id);
    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(200).json({ message: "Venda finalizada com sucesso." });
  }


  /* ! ========== Cancelar Venda ========== */
  async cancelarVenda(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: "Não implementado." });
  }
}
