import { prisma } from "../database";

// ========== Módulo Usuario ========== //
import UsuarioRepository from "../../modules/usuario/usuario.repository";
import UsuarioFactory from "../../modules/usuario/usuario.factory";
import UsuarioService from "../../modules/usuario/usuario.service";
import UsuarioController from "../../modules/usuario/usuario.controller";

const usuarioFactory = new UsuarioFactory();
const usuarioRepository = new UsuarioRepository(prisma, usuarioFactory);
const usuarioService = new UsuarioService(usuarioRepository, usuarioFactory);
const usuarioController = new UsuarioController(usuarioService);

// ========== Módulo Autorização ========== //
import { AutorizacaoService } from "../../modules/usuario/autorizacao/autorizacao.service";

const autorizacaoService = new AutorizacaoService();

// ========== Módulo Produto ========== //
import { ProdutoRepository } from "../../modules/produto/produto.repository";
import { ProdutoService } from "../../modules/produto/produto.service";
import ProdutoController from "../../modules/produto/produto.controller";

const produtoRepository = new ProdutoRepository(prisma);
const produtoService = new ProdutoService(produtoRepository, autorizacaoService);
const produtoController = new ProdutoController(produtoService);

// ========== Módulo ItemVenda ========== //
import { ItemVendaRepository } from "../../modules/itemVenda/itemVenda.repository";
import ItemVendaService from "../../modules/itemVenda/itemVenda.service";
import ItemVendaController from "../../modules/itemVenda/itemVenda.controller";
import { validacaoItemService } from "../../modules/itemVenda/validacaoItem/validacaoItem.service";

const itemVendaRepository = new ItemVendaRepository(prisma);
const itemVendaService = new ItemVendaService(itemVendaRepository, produtoService, autorizacaoService);
const validacaoItem = new validacaoItemService(itemVendaRepository, autorizacaoService);
const itemVendaController = new ItemVendaController(itemVendaService, validacaoItem);

// ========== Módulo Notificação ========== //
import { NotificacaoRepository } from "../../modules/notificacao/notificacao.repository";
import { NotificacaoService } from "../../modules/notificacao/notificacao.service";
import { NotificacaoController } from "../../modules/notificacao/notificacao.controller";
import NotificacaoSubject from "../../modules/notificacao/observer/NotificacaoSubject";
import FarmaceuticoObserver from "../../modules/notificacao/observer/FarmaceuticoObserver";

const notificacaoRepository = new NotificacaoRepository(prisma);
const notificacaoSubject = new NotificacaoSubject();
notificacaoSubject.adicionarObserver(new FarmaceuticoObserver());
const notificacaoService = new NotificacaoService(notificacaoRepository, notificacaoSubject, autorizacaoService);
const notificacaoController = new NotificacaoController(notificacaoService);

// ========== Módulo Venda ========== //
import { VendaRepository } from "../../modules/venda/venda.repository";
import { VendaService } from "../../modules/venda/venda.service";
import { VendaController } from "../../modules/venda/venda.controller";

const vendaRepository = new VendaRepository(prisma);
const vendaService = new VendaService(vendaRepository, itemVendaRepository, autorizacaoService, produtoService, notificacaoService);
const vendaController = new VendaController(vendaService);

// ========== Módulo Prescricao ========== //
import { PrescricaoRepository } from "../../modules/prescricao/prescricao.repository";
import { PerscricaoService } from "../../modules/prescricao/prescricao.service";
import { PrescricaoController } from "../../modules/prescricao/prescricao.controller";
import { CrmService } from "../../modules/prescricao/crm/crm.service";

const prescricaoRepository = new PrescricaoRepository(prisma);
const crmService = new CrmService();
const prescricaoService = new PerscricaoService(prescricaoRepository, crmService, vendaService);
const prescricaoController = new PrescricaoController(prescricaoService);

// ========== Módulo Autenticação ========== //
import AutenticacaoService from "../../modules/usuario/autenticacao/autenticacao.service";
import AutenticacaoController from "../../modules/usuario/autenticacao/autenticacao.controller";
import AuthGuard from "../middleware/authGuard";

const autenticacaoService = new AutenticacaoService(usuarioRepository);
const autenticacaoController = new AutenticacaoController(autenticacaoService);
const authGuard = new AuthGuard(autenticacaoService);

export { 
    usuarioController,
    produtoController,
    vendaController,
    itemVendaController,
    prescricaoController,
    notificacaoController,
    autenticacaoController,
    authGuard
};