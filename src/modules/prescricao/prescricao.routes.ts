import { Router } from "express";
import InterfacePrescricaoController from "./prescricao.controller";

export function criarPrescricaoRoutes(controller: InterfacePrescricaoController): Router {

    const prescricaoRouter = Router();

    prescricaoRouter.post( "/", controller.cadastrarPrescricao.bind(controller) );
    prescricaoRouter.get( "/", controller.listarPrescricoes.bind(controller));
    prescricaoRouter.get( "/venda/:vendaId", controller.listarPrescricoesPorVendaId.bind(controller));
    prescricaoRouter.get( "/:id", controller.buscarPrescricaoPorId.bind(controller));
    prescricaoRouter.get( "/numero/:numeroPrescricao", controller.buscarPrescricaoPorNumeroPrescricao.bind(controller));[]
    prescricaoRouter.put( "/:id", controller.editarPrescricao.bind(controller));
    prescricaoRouter.delete( "/:id", controller.deletarPrescricao.bind(controller));

    return prescricaoRouter;
}