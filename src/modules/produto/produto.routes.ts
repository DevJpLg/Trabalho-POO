import { Router } from "express";
import { ProdutoController } from "./produto.controller";

const produtoRoutes = Router();
const controller = new ProdutoController();

produtoRoutes.post("/", (req, res) => controller.cadastrarProduto(req, res));
produtoRoutes.get("/", (req, res) => controller.listarProdutos(req, res));
produtoRoutes.get("/busca", (req, res) => controller.buscarProduto(req, res));
produtoRoutes.get("/validades", (req, res) => controller.monitorarValidades(req, res));
produtoRoutes.put("/:id", (req, res) => controller.editarProduto(req, res));
produtoRoutes.delete("/:id", (req, res) => controller.deletarProduto(req, res));
produtoRoutes.patch("/:id/entrada", (req, res) => controller.realizarEntrada(req, res));
produtoRoutes.patch("/:id/baixa", (req, res) => controller.realizarBaixa(req, res));
produtoRoutes.patch("/:id/validade", (req, res) => controller.alterarValidade(req, res));
produtoRoutes.patch("/:id/bloquear", (req, res) => controller.bloquearProduto(req, res));

export { produtoRoutes };