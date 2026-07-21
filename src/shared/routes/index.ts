import { Router } from "express";

import { usuarioRoutes } from "../../modules/usuario/usuario.routes";
import { produtoRoutes } from "../../modules/produto/produto.routes";
import { estoqueRoutes } from "../../modules/estoque/estoque.routes";
import { vendaRoutes } from "../../modules/venda/venda.routes";
import { prescricaoRoutes } from "../../modules/prescricao/prescricao.routes";
import { notificacaoRoutes } from "../../modules/notificacao/notificacao.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/produtos", produtoRoutes);
router.use("/estoque", estoqueRoutes);
router.use("/vendas", vendaRoutes);
router.use("/prescricoes", prescricaoRoutes);
router.use("/notificacoes", notificacaoRoutes);

export { router };
