import { Router } from "express";
import InterfaceNotificacaoController from "./notificacao.controller";

export function criarNotificacaoRoutes(controller: InterfaceNotificacaoController): Router {
    const notificacaoRoutes = Router();

    notificacaoRoutes.get("/", (req, res) => controller.listar(req, res));
    notificacaoRoutes.post("/:id/atender", (req, res) => controller.atender(req, res));

    return notificacaoRoutes;
}
