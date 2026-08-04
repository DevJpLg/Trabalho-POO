import { Router } from "express";
import { InterfaceAutenticacaoController } from "./autenticacao.controller";

export function criarAutenticacaoRoutes(controller: InterfaceAutenticacaoController): Router {
    
    const autenticacaoRouter = Router();

    autenticacaoRouter.post("/login", controller.login.bind(controller));

    return autenticacaoRouter;
}