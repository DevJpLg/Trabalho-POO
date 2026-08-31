import { Router } from "express";
import InterfaceUsuarioController from "./usuario.controller";

export function criarUsuarioRoutes(controller: InterfaceUsuarioController): Router {
    
    const usuarioRouter = Router();

    usuarioRouter.get("/", controller.listarUsuario.bind(controller));
    usuarioRouter.post("/", controller.cadastrarUsuario.bind(controller));
    usuarioRouter.put("/:id", controller.editarUsuario.bind(controller));
    usuarioRouter.patch("/:id/status", controller.alterarStatusUsuario.bind(controller));
    usuarioRouter.delete("/:id", controller.deletarUsuario.bind(controller));

    return usuarioRouter;
}