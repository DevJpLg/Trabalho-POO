import InterfaceProdutoRepository from "./produto.repository";
import InterfaceAutorizacaoService from "../usuario/autorizacao/autorizacao.service";
import Produto, { Classificacao, DadosProduto } from "./index";
import Usuario from "../usuario";
import ItemVenda from "../itemVenda";

export default interface InterfaceProdutoService {
    cadastrarProduto(usuarioLogado: Usuario, dados: DadosProduto): Promise<boolean | Error>;
    listarProdutos(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error>;
    buscarProduto(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error>;
    editarProduto(usuarioLogado: Usuario, id: number, dados: DadosProduto): Promise<void | Error>;
    deletarProduto(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    realizarEntrada(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error>;
    realizarBaixa(usuarioLogado: Usuario, itens: ItemVenda[]): Promise<void | Error>;
    alterarValidade(usuarioLogado: Usuario, id: number, novaData: Date): Promise<void | Error>;
    monitorarValidades(usuarioLogado: Usuario, dias?: number): Promise<Produto[] | Error>;
    bloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    desbloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    verificarCondicoesVendaProduto(id: number, quantidadeDesejada: number): Promise<boolean | Error>;
    buscarPrecoUnitarioProduto(id: number): Promise<number | Error>;
    verificarExigeAvaliacaoProduto(id: number): Promise<boolean | Error>;
}

export class ProdutoService implements InterfaceProdutoService {
    private repository: InterfaceProdutoRepository;
    private autorizacaoService: InterfaceAutorizacaoService;

    constructor(repository: InterfaceProdutoRepository, autorizacaoService: InterfaceAutorizacaoService) {
        this.repository = repository;
        this.autorizacaoService = autorizacaoService;
    }


    /* ! ========== Cadastrar Produto ========== */
    public async cadastrarProduto(usuarioLogado: Usuario, dados: DadosProduto): Promise<boolean | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorCodigoBarras(dados.codigoBarras);
            if(produtoExistente) {
                return new Error("Produto já cadastrado");
            }

            const classificacao = dados.classificacao ?? Classificacao.LIVRE;
            if(classificacao !== Classificacao.LIVRE) {
                if(!dados.principioAtivo)        { return new Error("Princípio ativo inválido"); }
                if(!dados.concentracao)          { return new Error("Concentração inválida"); }
                if(!dados.formaFarmaceutica)     { return new Error("Formafarmacêutica inválida"); }
                if(!dados.numeroRegAnvisa)       { return new Error("Número de registro ANVISA inválido"); }
                if(!dados.tarja)                 { return new Error("Tarja inválida"); }
                if(!dados.classeControle)        { return new Error("Classe de controle inválida"); }
                if(typeof dados.retencaoReceita !== "boolean") { return new Error("Retenção de receita inválida"); }
                if(!dados.validadeReceita)       { return new Error("Validade de receita inválida"); }
                if(!dados.quantidadeMaxima)      { return new Error("Quantidade máxima inválida"); }
                if(typeof dados.generico !== "boolean") { return new Error("Generico inválido"); }
            }

            const produtoCriado = Produto.criarProduto({ ...dados, classificacao });
            if(produtoCriado instanceof Error) {
                return produtoCriado;
            }

            const produtoCadastrado = await this.repository.cadastrarProduto(produtoCriado);
            if(!produtoCadastrado) {
                return new Error("Erro ao cadastrar produto");
            }
            return true;

        } catch (error) {
            return new Error(error instanceof Error ? error.message : "Erro ao criar produto");
        }
    }


    /* ! ========== Listar Produtos ========== */
    public async listarProdutos(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeListarProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.listarProdutos(busca);
            if (resultado === null) {
                return [];
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao listar produtos");
        }
    }


    /* ! ========== Buscar Produto ========== */
    public async buscarProduto(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error> {
        try {
            const resultado = await this.repository.buscarProduto(busca);
            if (resultado === null) {
                return [];
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao buscar produto");
        }
    }


    /* ! ========== Editar Produto ========== */
    public async editarProduto(usuarioLogado: Usuario, id: number, dados: DadosProduto): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            const classificacao = dados.classificacao ?? Classificacao.LIVRE;
            if(classificacao !== Classificacao.LIVRE) {
                if(!dados.principioAtivo)        { return new Error("Princípio ativo inválido"); }
                if(!dados.concentracao)          { return new Error("Concentração inválida"); }
                if(!dados.formaFarmaceutica)     { return new Error("Formafarmacêutica inválida"); }
                if(!dados.numeroRegAnvisa)       { return new Error("Número de registro ANVISA inválido"); }
                if(!dados.tarja)                 { return new Error("Tarja inválida"); }
                if(!dados.classeControle)        { return new Error("Classe de controle inválida"); }
                if(typeof dados.retencaoReceita !== "boolean") { return new Error("Retenção de receita inválida"); }
                if(!dados.validadeReceita)       { return new Error("Validade de receita inválida"); }
                if(!dados.quantidadeMaxima)      { return new Error("Quantidade máxima inválida"); }
                if(typeof dados.generico !== "boolean") { return new Error("Generico inválido"); }
            }

            const codigoEmUso = await this.repository.buscarProdutoPorCodigoBarras(dados.codigoBarras);
            if(codigoEmUso && codigoEmUso.getId() !== id) {
                return new Error("Código de barras já cadastrado em outro produto");
            }

            const isProdutoAtivo = await this.repository.buscarIsActiveProduto(id);
            if(isProdutoAtivo === null) {
                return new Error("Erro ao buscar status do produto");
            }

            const produtoNovo = produtoExistente.editarProduto({ ...dados, classificacao }); 
            if(produtoNovo instanceof Error) {
                return produtoNovo;
            }

            const resultado = await this.repository.editarProduto(produtoNovo);
            if(!resultado) {
                return new Error("Erro ao atualizar produto");
            }
        } catch (error) {
            return new Error(error instanceof Error ? error.message : "Erro ao editar produto");
        }
    }


    /* ! ========== Deletar Produto ========== */
    public async deletarProduto(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            const resultado = await this.repository.deletarProduto(id);
            if(!resultado) {
                return new Error("Erro ao deletar produto");
            }
        } catch (error) {
            return new Error("Erro ao deletar produto");
        }
    }


    /* ! ========== Realizar Entrada de Estoque ========== */
    public async realizarEntrada(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(qtd) || qtd <= 0) {
                return new Error("Quantidade de entrada deve ser maior que zero");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            const statusProduto = produtoExistente.getIsActive();
            if(!statusProduto) {
                return new Error("Produto bloqueado não pode receber entrada de estoque");
            }

            const dataVencimento = produtoExistente.getValidade();
            if(dataVencimento !== null && dataVencimento < new Date()) {
                return new Error("Produto vencido não pode receber entrada de estoque");
            }

            const resultado = await this.repository.realizarEntrada(produtoExistente, qtd);
            if(!resultado) {
                return new Error("Erro ao registrar entrada no estoque");
            }
        } catch (error) {
            return new Error("Erro ao registrar entrada no estoque");
        }
    }


    /* ! ========== Realizar Baixa de Estoque ========== */
    public async realizarBaixa(usuarioLogado: Usuario, itens: ItemVenda[]): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            for (const item of itens) {
                const id = item.getProdutoId();
                const qtd = item.getQuantidade();

                if(!Number.isInteger(qtd) || qtd <= 0) {
                    return new Error("Quantidade de baixa deve ser maior que zero");
                }

                const produtoExistente = await this.repository.buscarProdutoPorId(id);
                if(!produtoExistente || produtoExistente === null) {
                    return new Error("Produto não encontrado");
                }

                if(!produtoExistente.getIsActive()) {
                    return new Error("Produto bloqueado não pode sofrer baixa de estoque");
                }

                const quantidadeEstoque = produtoExistente.getQuantidadeEstoque();
                if(quantidadeEstoque === null || quantidadeEstoque < qtd) {
                    return new Error("Quantidade em estoque insuficiente para a baixa");
                }

                const resultado = await this.repository.realizarBaixa(id, qtd);
                if(!resultado) {
                    return new Error("Erro ao realizar baixa no estoque");
                }
            }
        } catch (error) {
            return new Error("Erro ao realizar baixa no estoque");
        }
    }


    /* ! ========== Alterar Validade do Produto ========== */
    public async alterarValidade(usuarioLogado: Usuario, id: number, novaData: Date): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarValidades(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            if(!(novaData instanceof Date) || Number.isNaN(novaData.getTime())) {
                return new Error("Data de validade inválida");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            const dataFabricacao = produtoExistente.getDataFabricacao();
            if(dataFabricacao !== null && novaData <= dataFabricacao && novaData < new Date()) {
                return new Error("Validade deve ser posterior à data de fabricação");
            }

            const resultado = await this.repository.alterarValidade(produtoExistente, novaData);
            if(!resultado) {
                return new Error("Erro ao alterar validade do produto");
            }
        } catch (error) {
            return new Error("Erro ao alterar validade do produto");
        }
    }


    /* ! ========== Monitorar Validades ========== */
    public async monitorarValidades(usuarioLogado: Usuario, dias: number = 30): Promise<Produto[] | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarValidades(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + dias); //Seta o tempo limite para até 1 mês a partir do hoje

            const resultado = await this.repository.listarProdutosPorValidade(dataLimite);
            if (resultado === null) {
                return [];
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao monitorar validades");
        }
    }


    /* ! ========== Bloquear Produto ========== */
    public async bloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeBloquearProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            const statusAtualProduto = produtoExistente.getIsActive();
            if(!statusAtualProduto) {
                return new Error("Produto já está bloqueado");
            }

            const resultado = await this.repository.bloquearProduto(produtoExistente);
            if(!resultado) {
                return new Error("Erro ao alterar status do produto");
            }
        } catch (error) {
            return new Error("Erro ao alterar status do produto");
        }
    }


    /* ! ========== Desbloquear Produto ========== */
    public async desbloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeBloquearProdutos(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            } 
            
            const statusAtualProduto = produtoExistente.getIsActive();
            if(statusAtualProduto) {
                return new Error("Produto já está desbloqueado");
            }

            const validadeProduto = produtoExistente.getValidade();
            const dataFabricacaoProduto = produtoExistente.getDataFabricacao();
            if(dataFabricacaoProduto === null || validadeProduto === null) {
                return new Error("Erro ao buscar datas de fabricação e validade do produto");
            }
            if(validadeProduto < new Date() || validadeProduto <= dataFabricacaoProduto) {
                return new Error("Produto vencido não pode ser desbloqueado");
            }

            const resultado = await this.repository.desbloquearProduto(produtoExistente);
            if(!resultado) {
                return new Error("Erro ao alterar status do produto");
            }
        } catch (error) {
            return new Error("Erro ao alterar status do produto");
        }
    }


    /* ! ========== Verifica se o produto está em condições de ser vendido ========== */
    public async verificarCondicoesVendaProduto(id: number, quantidadeDesejada: number): Promise<boolean> {
        try {
            const produto = await this.repository.buscarProdutoPorId(id);
            if(!produto || produto === null) {
                return false;
            }

            if(!produto.getIsActive()) {
                return false;
            }

            const validade = produto.getValidade();
            if(validade === null || validade < new Date()) {
                return false;
            }

            const produtoQuantidadeMaxima = produto.getQuantidadeMaxima();
            if(produtoQuantidadeMaxima !== null && quantidadeDesejada > produtoQuantidadeMaxima) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }


    /* ! ========== Buscar Preço Unitário do Produto ========== */
    public async buscarPrecoUnitarioProduto(id: number): Promise<number | Error> {
        try {
            const produto = await this.repository.buscarProdutoPorId(id);
            if(!produto || produto === null) {
                return new Error("Produto não encontrado");
            }
            return produto.getPreco();
        } catch (error) {
            return new Error("Erro ao buscar preço unitário do produto");
        }
    }


    /* ! ========== Verificar se o produto exige avaliação ========== */
    public async verificarExigeAvaliacaoProduto(id: number): Promise<boolean> {
        try {
            const produto = await this.repository.buscarProdutoPorId(id);
            if(!produto || produto === null) {
                return false;
            }
            return produto.getClassificacao() === Classificacao.CONTROLADO || produto.getClassificacao() === Classificacao.PRESCRITO;
        } catch (error) {
            return false;
        }
    }
}