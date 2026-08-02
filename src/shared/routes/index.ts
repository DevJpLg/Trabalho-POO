import { Router } from "express";
import { authGuard } from "../middleware";

import { autenticacaoController } from "../container";
import { criarAutenticacaoRoutes } from "../../modules/usuario/autenticacao/autenticacao.routes";

import { usuarioController } from "../container";
import { criarUsuarioRoutes } from "../../modules/usuario/usuario.routes";

import { produtoController } from "../container";
import { criarProdutoRoutes } from "../../modules/produto/produto.routes";

import { vendaController } from "../container";
import { criarVendaRoutes } from "../../modules/venda/venda.routes";

import { itemVendaController } from "../container";
import { criarItemVendaRoutes } from "../../modules/itemVenda/itemVenda.routes";

import { prescricaoController } from "../container";
import { criarPrescricaoRoutes } from "../../modules/prescricao/prescricao.routes";

import { notificacaoController } from "../container";
import { criarNotificacaoRoutes } from "../../modules/notificacao/notificacao.routes";

const router = Router();

router.use("/autenticacao", criarAutenticacaoRoutes(autenticacaoController));

router.use(authGuard.verificar.bind(authGuard)); //Daki pra baixo tudo verifica se o usuário está autenticado

router.use("/usuarios", criarUsuarioRoutes(usuarioController));
router.use("/produtos", criarProdutoRoutes(produtoController));
router.use("/vendas", criarVendaRoutes(vendaController));
router.use("/itens-venda", criarItemVendaRoutes(itemVendaController));
router.use("/prescricoes", criarPrescricaoRoutes(prescricaoController));
router.use("/notificacoes", criarNotificacaoRoutes(notificacaoController));

export { router };
