import { Router } from "express";
import { NotificacaoController } from "./notificacao.controller";

export function criarNotificacaoRoutes(controller: NotificacaoController): Router {
  const notificacaoRoutes = Router();

  notificacaoRoutes.get("/", (req, res) => controller.listar(req, res));
  notificacaoRoutes.patch("/:id/lida", (req, res) => controller.marcarComoLida(req, res));
  notificacaoRoutes.get("/nao-lidas/contagem", (req, res) => controller.contarNaoLidas(req, res));

  return notificacaoRoutes;
}
