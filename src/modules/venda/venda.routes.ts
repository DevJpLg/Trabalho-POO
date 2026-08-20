import { Router } from "express";
import { VendaController } from "./venda.controller";

export function criarVendaRoutes(controller: VendaController): Router {
  const vendaRoutes = Router();

  vendaRoutes.post("/", (req, res) => controller.iniciarVenda(req, res));
  vendaRoutes.post("/:id/itens", (req, res) => controller.adicionarItem(req, res));
  vendaRoutes.delete("/:id/itens/:itemId", (req, res) => controller.removerItem(req, res));
  vendaRoutes.patch("/:id/finalizar", (req, res) => controller.finalizarVenda(req, res));
  vendaRoutes.patch("/:id/cancelar", (req, res) => controller.cancelarVenda(req, res));
  vendaRoutes.get("/", (req, res) => controller.listar(req, res));
  vendaRoutes.get("/:id", (req, res) => controller.buscarPorId(req, res));

  return vendaRoutes;
}
