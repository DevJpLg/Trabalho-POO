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

// ========== Módulo Produto ========== //
import ProdutoRepository from "../../modules/produto/produto.repository";
// import ProdutoFactory from "../../modules/produto/produto.factory";
import ProdutoService from "../../modules/produto/produto.service";
import ProdutoController from "../../modules/produto/produto.controller";
import ProdutoMapper from "../../modules/produto/produto.mapper";

const produtoMapper = new ProdutoMapper();
// const produtoFactory = new ProdutoFactory();
const produtoRepository = new ProdutoRepository(prisma);
const produtoService = new ProdutoService(produtoRepository);
const produtoController = new ProdutoController(produtoService, produtoMapper);

// ========== Módulo Venda ========== //
import VendaRepository from "../../modules/venda/venda.repository";
// import VendaFactory from "../../modules/venda/venda.factory";
import VendaService from "../../modules/venda/venda.service";
import VendaController from "../../modules/venda/venda.controller";

// const vendaFactory = new VendaFactory();
const vendaRepository = new VendaRepository(prisma);
const vendaService = new VendaService(vendaRepository);
const vendaController = new VendaController(vendaService);

// ========== Módulo ItemVenda ========== //
import ItemVendaRepository from "../../modules/itemVenda/itemVenda.repository";
// import ItemVendaFactory from "../../modules/itemVenda/itemVenda.factory";
import ItemVendaService from "../../modules/itemVenda/itemVenda.service";
import ItemVendaController from "../../modules/itemVenda/itemVenda.controller";

// const itemVendaFactory = new ItemVendaFactory();
const itemVendaRepository = new ItemVendaRepository(prisma);
const itemVendaService = new ItemVendaService(itemVendaRepository);
const itemVendaController = new ItemVendaController(itemVendaService);

// ========== Módulo Prescricao ========== //
import PrescricaoRepository from "../../modules/prescricao/prescricao.repository";
// import PrescricaoFactory from "../../modules/prescricao/prescricao.factory";
import PrescricaoService from "../../modules/prescricao/prescricao.service";
import PrescricaoController from "../../modules/prescricao/prescricao.controller";

// const prescricaoFactory = new PrescricaoFactory();
const prescricaoRepository = new PrescricaoRepository(prisma);
const prescricaoService = new PrescricaoService(prescricaoRepository);
const prescricaoController = new PrescricaoController(prescricaoService);

// ========== Módulo Notificação ========== //
import NotificacaoRepository from "../../modules/notificacao/notificacao.repository";
// import NotificacaoFactory from "../../modules/notificacao/notificacao.factory";
import NotificacaoService from "../../modules/notificacao/notificacao.service";
import NotificacaoController from "../../modules/notificacao/notificacao.controller";

// const notificacaoFactory = new NotificacaoFactory();
const notificacaoRepository = new NotificacaoRepository(prisma);
const notificacaoService = new NotificacaoService(notificacaoRepository);
const notificacaoController = new NotificacaoController(notificacaoService);

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