import { Router } from "express";
import InterfaceVendaController from "./venda.controller";

export function criarVendaRoutes(controller: InterfaceVendaController): Router {
  const vendaRouter = Router();

  vendaRouter.post("/", (req, res) => controller.registrarVenda(req, res));
  vendaRouter.get("/", (req, res) => controller.listarVendas(req, res));
  vendaRouter.get("/:id", (req, res) => controller.buscarPorId(req, res));
  vendaRouter.patch("/:id/finalizar", (req, res) => controller.finalizarVenda(req, res));
  vendaRouter.patch("/:id/cancelar", (req, res) => controller.cancelarVenda(req, res));

  return vendaRouter;
}
