import { Router } from "express";
import { InterfaceItemVendaController } from "./itemVenda.controller";

export function criarItemVendaRoutes(controller: InterfaceItemVendaController): Router {
    const itemVendaRouter = Router();

    itemVendaRouter.post("/venda/:vendaId", (req, res) => controller.adicionarItem(req, res));
    itemVendaRouter.get("/venda/:vendaId", (req, res) => controller.listarItensVenda(req, res));
    itemVendaRouter.get("/venda/:vendaId/total", (req, res) => controller.calcularTotalVenda(req, res));
    itemVendaRouter.patch("/venda/:vendaId/avaliar", (req, res) => controller.avaliarVenda(req, res));
    itemVendaRouter.get("/venda/:vendaId/item/:id", (req, res) => controller.buscarItemPorId(req, res));
    itemVendaRouter.patch("/venda/:vendaId/item/:id", (req, res) => controller.atualizarQuantidade(req, res));
    itemVendaRouter.delete("/venda/:vendaId/item/:id", (req, res) => controller.removerItem(req, res));
    itemVendaRouter.patch("/venda/:vendaId/item/:id/aprovar", (req, res) => controller.aprovarItem(req, res));
    itemVendaRouter.patch("/venda/:vendaId/item/:id/recusar", (req, res) => controller.recusarItem(req, res));

    return itemVendaRouter;
}