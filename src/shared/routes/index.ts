import { Router } from "express";

import { usuarioRoutes } from "../../modules/usuario/usuario.routes";
import { produtoRoutes } from "../../modules/produto/produto.routes";
import { vendaRoutes } from "../../modules/venda/venda.routes";
import { itemVendaRoutes } from "../../modules/itemVenda/itemVenda.routes";
import { prescricaoRoutes } from "../../modules/prescricao/prescricao.routes";
import { notificacaoRoutes } from "../../modules/notificacao/notificacao.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/produtos", produtoRoutes);
router.use("/vendas", vendaRoutes);
router.use("/itens-venda", itemVendaRoutes);
router.use("/prescricoes", prescricaoRoutes);
router.use("/notificacoes", notificacaoRoutes);

export { router };
