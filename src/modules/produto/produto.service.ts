import { InterfaceProdutoRepository } from "./produto.repository";
import Produto, { DadosProduto } from "./index";
import Usuario, { Perfil } from "../usuario";

export interface InterfaceProdutoService {
    cadastrarProduto(usuarioLogado: Usuario, dados: DadosProduto): Promise<boolean | Error>;
    listarProdutos(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error>;
    buscarProduto(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error>;
    editarProduto(usuarioLogado: Usuario, id: number, dados: DadosProduto): Promise<void | Error>;
    deletarProduto(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    realizarEntrada(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error>;
    realizarBaixa(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error>;
    alterarValidade(usuarioLogado: Usuario, id: number, novaData: Date): Promise<void | Error>;
    monitorarValidades(usuarioLogado: Usuario, dias?: number): Promise<Produto[] | Error>;
    bloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error>;
}

export default class ProdutoService implements InterfaceProdutoService {
    private repository: InterfaceProdutoRepository;

    constructor(repository: InterfaceProdutoRepository) {
        this.repository = repository;
    }


    public async cadastrarProduto(usuarioLogado: Usuario, dados: DadosProduto): Promise<boolean | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorCodigoBarras(dados.codigoBarras);
            if(produtoExistente) {
                return new Error("Produto já cadastrado");
            }

            if(!Produto.validarProduto(dados)) {
                return new Error("Dados do produto inválidos");
            }

            const produtoCriado = Produto.criarProduto(dados);
            if(!produtoCriado) {
                return new Error("Erro ao criar produto");
            }

            const produtoCadastrado = await this.repository.cadastrarProduto(produtoCriado);
            if(!produtoCadastrado) {
                return new Error("Erro ao cadastrar produto");
            }
            return true;

        } catch (error) {
            return new Error("Erro ao criar produto");
        }
    }


    public async listarProdutos(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.listarProdutos(busca);
            if(!resultado || resultado === null) {
                return new Error("Nenhum produto encontrado");
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao listar produtos");
        }
    }


    public async buscarProduto(usuarioLogado: Usuario, busca: string): Promise<Produto[] | Error> {
        try {
            if(!usuarioLogado) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.buscarProduto(busca);
            if(!resultado || resultado === null) {
                return new Error("Nenhum produto encontrado");
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao buscar produto");
        }
    }


    public async editarProduto(usuarioLogado: Usuario, id: number, dados: DadosProduto): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            if(!Produto.validarProduto(dados)) {
                return new Error("Dados do produto inválidos");
            }

            const codigoEmUso = await this.repository.buscarProdutoPorCodigoBarras(dados.codigoBarras);
            if(codigoEmUso && codigoEmUso.getId() !== id) {
                return new Error("Código de barras já cadastrado em outro produto");
            }

            const produtoAtualizado = new Produto(id, dados);

            const resultado = await this.repository.editarProduto(produtoAtualizado);
            if(!resultado) {
                return new Error("Erro ao atualizar produto");
            }
        } catch (error) {
            return new Error("Erro ao editar produto");
        }
    }


    public async deletarProduto(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
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


    public async realizarEntrada(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(qtd) || qtd <= 0) {
                return new Error("Quantidade de entrada deve ser maior que zero");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            if(produtoExistente.estaVencido()) {
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


    public async realizarBaixa(usuarioLogado: Usuario, id: number, qtd: number): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.CAIXA) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(qtd) || qtd <= 0) {
                return new Error("Quantidade de baixa deve ser maior que zero");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            if(!produtoExistente.possuiEstoqueSuficiente(qtd)) {
                return new Error("Quantidade em estoque insuficiente para a baixa");
            }

            const resultado = await this.repository.realizarBaixa(produtoExistente, qtd);
            if(!resultado) {
                return new Error("Erro ao realizar baixa no estoque");
            }
        } catch (error) {
            return new Error("Erro ao realizar baixa no estoque");
        }
    }


    public async alterarValidade(usuarioLogado: Usuario, id: number, novaData: Date): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
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
            if(dataFabricacao !== null && novaData <= dataFabricacao) {
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


    public async monitorarValidades(usuarioLogado: Usuario, dias: number = 30): Promise<Produto[] | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.FARMACEUTICO) {
                return new Error("Usuário não autorizado");
            }

            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + dias);

            const resultado = await this.repository.listarProdutosPorValidade(dataLimite);
            if(!resultado || resultado === null) {
                return new Error("Nenhum produto encontrado");
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao monitorar validades");
        }
    }


    public async bloquearProduto(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.FARMACEUTICO) {
                return new Error("Usuário não autorizado");
            }

            const produtoExistente = await this.repository.buscarProdutoPorId(id);
            if(!produtoExistente || produtoExistente === null) {
                return new Error("Produto não encontrado");
            }

            if(!produtoExistente.estaVencido()) {
                return new Error("Produto ainda está dentro do prazo de validade");
            }

            const resultado = await this.repository.bloquearProduto(produtoExistente);
            if(!resultado) {
                return new Error("Erro ao bloquear produto");
            }
        } catch (error) {
            return new Error("Erro ao bloquear produto");
        }
    }
}