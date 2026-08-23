import { Router } from "express";
import { InterfaceProdutoController } from "./produto.controller";


export function criarProdutoRoutes(controller: InterfaceProdutoController): Router {
    const produtoRouter = Router();

    produtoRouter.post("/", (req, res) => controller.cadastrarProduto(req, res));
    produtoRouter.get("/", (req, res) => controller.listarProdutos(req, res));
    produtoRouter.get("/busca", (req, res) => controller.buscarProduto(req, res));
    produtoRouter.get("/validades", (req, res) => controller.monitorarValidades(req, res));
    produtoRouter.put("/:id", (req, res) => controller.editarProduto(req, res));
    produtoRouter.delete("/:id", (req, res) => controller.deletarProduto(req, res));
    produtoRouter.patch("/:id/entrada", (req, res) => controller.realizarEntrada(req, res));
    produtoRouter.patch("/:id/baixa", (req, res) => controller.realizarBaixa(req, res));
    produtoRouter.patch("/:id/validade", (req, res) => controller.alterarValidade(req, res));
    produtoRouter.patch("/:id/bloquear", (req, res) => controller.bloquearProduto(req, res));
    produtoRouter.patch("/:id/desbloquear", (req, res) => controller.desbloquearProduto(req, res));

    return produtoRouter;
}
