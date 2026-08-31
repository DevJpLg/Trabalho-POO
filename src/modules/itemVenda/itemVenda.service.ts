import ItemVenda from "./index";
import Usuario from "../usuario"; //Importo por enquanto pq eu preciso conhecer o tipo dele
import InterfaceAutorizacaoService from "../usuario/autorizacao/autorizacao.service";
import InterfaceItemVendaRepository from "./itemVenda.repository";
import InterfaceProdutoService from "../produto/produto.service";


export interface InterfaceItemVendaService {
    adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<number | Error>;
    listarItensVenda(usuarioLogado: Usuario, vendaId: number, busca?: string): Promise<ItemVenda[] | Error>;
    buscarItemPorId(usuarioLogado: Usuario, vendaId: number, id: number): Promise<ItemVenda | Error>;
    atualizarQuantidade(usuarioLogado: Usuario, vendaId: number, id: number, quantidade: number): Promise<void | Error>;
    removerItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error>;
    calcularTotalVenda(usuarioLogado: Usuario, vendaId: number): Promise<number | Error>;
}


export default class ItemVendaService implements InterfaceItemVendaService {
    private repository: InterfaceItemVendaRepository;
    private produtoService: InterfaceProdutoService;
    private autorizacaoService: InterfaceAutorizacaoService;

    constructor(repository: InterfaceItemVendaRepository, produtoService: InterfaceProdutoService, autorizacaoService: InterfaceAutorizacaoService) {
        this.repository = repository;
        this.produtoService = produtoService;
        this.autorizacaoService = autorizacaoService;
    }

    /* ! ========== Adicionar Item (ou somar quantidade caso exista) ========== */
    public async adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<number | Error> {
        try {
            //Verifica se o usuario tem autorização para mudar itens da venda
            if(!(await this.autorizacaoService.usuarioPodeGerenciarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            // Por enquanto não temos venda. Acho que isso é tratado dentro da state
            // if(!VendaService.vendaPermiteAlteracaoDeItens(vendaId)) {
            //     return new Error("Venda não permite alteração de itens");
            // }

            //verifica se a nova quantidade é válida
            if(!Number.isInteger(quantidade) || quantidade <= 0) {
                return new Error("Quantidade do item deve ser maior que zero");
            }

            //Salvo o produto existente (caso exista, vamos apenas somar a quantidade)
            const itemExistente = await this.repository.buscarItemPorProduto(vendaId, produtoId);
            let quantidadeTotalItemVenda = 0;
            if(itemExistente !== null) {
                quantidadeTotalItemVenda = itemExistente.getQuantidade() + quantidade;
            }

            //verifica se o produto existe, está ativo, está na validade e pode ser vendida a quantidade informada
            if(!(await this.produtoService.verificarCondicoesVendaProduto(produtoId, quantidadeTotalItemVenda))) {
                return new Error("Produto não está em condições de ser vendido");
            }

            //Se o item já existe, vamos apenas somar a quantidade
            if(itemExistente !== null) {
                itemExistente.alterarQuantidade(itemExistente.getQuantidade() + quantidade);
                if(!(await this.repository.atualizarQuantidadeItem(itemExistente, itemExistente.getQuantidade() + quantidade))) {
                    return new Error("Erro ao atualizar quantidade do item");
                }
                return itemExistente.getId();

            //Se o item não existe, vamos criar um novo
            } else {
                const precoUnitario = await this.produtoService.buscarPrecoUnitarioProduto(produtoId);
                if(precoUnitario instanceof Error) {
                    return precoUnitario;
                }

                const exigeAvaliacao = await this.produtoService.verificarExigeAvaliacaoProduto(produtoId);
                if (exigeAvaliacao instanceof Error) {
                    return exigeAvaliacao;
                }

                const itemCriado = ItemVenda.criarItemVenda(quantidade, precoUnitario, exigeAvaliacao, vendaId, produtoId );
                if(itemCriado instanceof Error) {
                    return itemCriado;
                }

                if(!(await this.repository.adicionarItem(itemCriado))) {
                    return new Error("Erro ao criar item de venda");
                }
                return itemCriado.getId();
            }
        } catch (error) {
            return new Error("Erro ao adicionar item à venda");
        }
    }


    public async listarItensVenda(usuarioLogado: Usuario, vendaId: number, busca: string = ""): Promise<ItemVenda[] | Error> {
        try {
            const podeListar = await this.autorizacaoService.usuarioPodeGerenciarItemVendas(usuarioLogado);
            if(!podeListar) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.listarItensVenda(vendaId, busca);
            if(!resultado || resultado === null || resultado.length === 0) {
                return new Error("Nenhum item encontrado na venda");
            }

            return resultado;
        } catch (error) {
            return new Error("Erro ao listar itens da venda");
        }
    }


    /* ! ========== Buscar Item por Id ========== */
    public async buscarItemPorId(usuarioLogado: Usuario, vendaId: number, id: number): Promise<ItemVenda | Error> {
        try {
            const podeListar =
                (await this.autorizacaoService.usuarioPodeGerenciarItemVendas(usuarioLogado)) ||
                (await this.autorizacaoService.usuarioPodeAvaliarItemVendas(usuarioLogado));
            if(!podeListar) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.buscarItemPorId(vendaId, id);
            if(!resultado || resultado === null) {
                return new Error("Item de venda não encontrado");
            }

            return resultado;
        } catch (error) {
            return new Error("Erro ao buscar item de venda");
        }
    }


    /* ! ========== Atualizar Quantidade do Item ========== */
    public async atualizarQuantidade(usuarioLogado: Usuario, vendaId: number, id: number, quantidade: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(quantidade)) {
                return new Error("Quantidade do item deve ser um número inteiro");
            }

            const itemExistente = await this.repository.buscarItemPorId(vendaId, id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            // Por enquanto não temos venda. Acho que isso é tratado dentro da state
            // if(!VendaService.vendaPermiteAlteracaoDeItens(vendaId)) {
            //     return new Error("Venda não permite alteração de itens");
            // }

            const quantidadeAtual = itemExistente.getQuantidade();
            if(quantidade === quantidadeAtual) {
                return;
            }

            //verifica se o produto existe, está ativo, está na validade e pode ser vendida a quantidade informada
            if(!(await this.produtoService.verificarCondicoesVendaProduto(itemExistente.getProdutoId(), quantidade))) {
                return new Error("Produto não está em condições de ser vendido");
            }

            // Se o item ja foi avaliado, qualquer alteração deve remover a aprovação e aguardar uma nova
            if((itemExistente.getExigeAvaliacao()) && (itemExistente.getAprovadoFarmaceutico())) {
                itemExistente.registrarAvaliacao(false);
                if(!(await this.repository.atualizarAprovacao(itemExistente))) {
                    return new Error("Erro ao reprovar item");
                }
            }

            itemExistente.alterarQuantidade(quantidade);
            if(!(await this.repository.atualizarQuantidadeItem(itemExistente, quantidade))) {
                return new Error("Erro ao atualizar quantidade do item");
            }
        } catch (error) {
            return new Error("Erro ao atualizar quantidade do item");
        }
    }


    /* ! ========== Remover Item ========== */
    public async removerItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(vendaId, id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            // Por enquanto não temos venda. Acho que isso é tratado dentro da state
            // if(!VendaService.vendaPermiteAlteracaoDeItens(vendaId)) {
            //     return new Error("Venda não permite alteração de itens");
            // }

            const resultado = await this.repository.removerItem(itemExistente);
            if(!resultado) {
                return new Error("Erro ao remover item da venda");
            }
        } catch (error) {
            return new Error("Erro ao remover item da venda");
        }
    }


    /* ! ========== Calcular Total da Venda ========== */
    public async calcularTotalVenda(usuarioLogado: Usuario, vendaId: number): Promise<number | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeGerenciarVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const itens = await this.repository.listarItensVenda(vendaId);
            if(!itens || itens === null || itens.length === 0) {
                return new Error("Nenhum item encontrado na venda");
            }

            let total = 0;

            for (const item of itens) {
                total = total + item.getPrecoSubtotal();
            }
            return Math.round(total * 100) / 100;
        } catch (error) {
            return new Error("Erro ao calcular total da venda");
        }
    }
}