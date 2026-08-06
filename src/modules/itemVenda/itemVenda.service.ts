import { InterfaceItemVendaRepository } from "./itemVenda.repository";
import ItemVenda from "./index";
import Produto, { Classificacao } from "../produto";
import { StatusVenda } from "../venda";
import Usuario, { Perfil } from "../usuario";
export interface InterfaceConsultaProduto {
    buscarProdutoPorId(id: number): Promise<Produto | null>;
}
export interface InterfaceItemVendaService {
    adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<boolean | Error>;
    listarItensVenda(usuarioLogado: Usuario, vendaId: number): Promise<ItemVenda[] | Error>;
    buscarItemPorId(usuarioLogado: Usuario, id: number): Promise<ItemVenda | Error>;
    atualizarQuantidade(usuarioLogado: Usuario, id: number, quantidade: number): Promise<void | Error>;
    removerItem(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    aprovarItem(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    recusarItem(usuarioLogado: Usuario, id: number): Promise<void | Error>;
    avaliarVenda(usuarioLogado: Usuario, vendaId: number, aprovado: boolean): Promise<void | Error>;
    calcularTotalVenda(usuarioLogado: Usuario, vendaId: number): Promise<number | Error>;
}
export default class ItemVendaService implements InterfaceItemVendaService {
    private repository: InterfaceItemVendaRepository;

    constructor(repository: InterfaceItemVendaRepository, private produtoRepository: InterfaceConsultaProduto) {
        this.repository = repository;
    }


    private podeGerenciarItens(usuarioLogado: Usuario): boolean {
        return usuarioLogado.getPerfil() === Perfil.ATENDENTE || usuarioLogado.getPerfil() === Perfil.CAIXA;
    }

    private podeAvaliarItens(usuarioLogado: Usuario): boolean {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    private vendaPermiteAlteracaoDeItens(statusVenda: StatusVenda): boolean {
        return statusVenda === StatusVenda.EM_ANDAMENTO || statusVenda === StatusVenda.AGUARDANDO_PAGAMENTO;
    }

    private vendaEstaEmAvaliacao(statusVenda: StatusVenda): boolean {
        return statusVenda === StatusVenda.EM_AVALIACAO;
    }

    public async adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<boolean | Error> {
        try {
            if(!this.podeGerenciarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(quantidade) || quantidade <= 0) {
                return new Error("Quantidade do item deve ser maior que zero");
            }

            const statusVenda = await this.repository.buscarStatusVenda(vendaId);
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaPermiteAlteracaoDeItens(statusVenda)) {
                return new Error("Venda não permite alteração de itens");
            }

            const produto = await this.produtoRepository.buscarProdutoPorId(produtoId);
            if(!produto || produto === null) {
                return new Error("Produto não encontrado");
            }

            if(!produto.getIsActive()) {
                return new Error("Produto bloqueado não pode ser vendido");
            }

            const validade = produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return new Error("Produto vencido não pode ser vendido");
            }

            if(produto.getQuantidadeEstoque() < quantidade) {
                return new Error("Quantidade em estoque insuficiente");
            }

            const quantidadeMaxima = produto.getQuantidadeMaxima();
            if(produto.getClassificacao() !== Classificacao.LIVRE && quantidadeMaxima !== null && quantidade > quantidadeMaxima) {
                return new Error("Quantidade acima do limite permitido por receita");
            }

            const itemExistente = await this.repository.buscarItemPorVendaEProduto(vendaId, produtoId);
            if(itemExistente) {
                return new Error("Produto já adicionado à venda");
            }

            const itemCriado = ItemVenda.criarItemVenda({
                quantidade: quantidade,
                vendaId: vendaId,
                produtoId: produtoId,
                aprovadoFarmaceutico: produto.getClassificacao() === Classificacao.LIVRE,
            });
            if(!itemCriado) {
                return new Error("Erro ao criar item de venda");
            }

            const foiAdicionado = await this.repository.adicionarItem(itemCriado);
            if(!foiAdicionado) {
                return new Error("Erro ao adicionar item à venda");
            }
            return true;

        } catch (error) {
            return new Error("Erro ao adicionar item à venda");
        }
    }

    public async listarItensVenda(usuarioLogado: Usuario, vendaId: number): Promise<ItemVenda[] | Error> {
        try {
            const statusVenda = await this.repository.buscarStatusVenda(vendaId);
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            const resultado = await this.repository.listarItensVenda(vendaId);
            if(!resultado || resultado === null || resultado.length === 0) {
                return new Error("Nenhum item encontrado na venda");
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao listar itens da venda");
        }
    }

    public async buscarItemPorId(usuarioLogado: Usuario, id: number): Promise<ItemVenda | Error> {
        try {
            const resultado = await this.repository.buscarItemPorId(id);
            if(!resultado || resultado === null) {
                return new Error("Item de venda não encontrado");
            }
            return resultado;
        } catch (error) {
            return new Error("Erro ao buscar item de venda");
        }
    }

    public async atualizarQuantidade(usuarioLogado: Usuario, id: number, quantidade: number): Promise<void | Error> {
        try {
            if(!this.podeGerenciarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            if(!Number.isInteger(quantidade) || quantidade <= 0) {
                return new Error("Quantidade do item deve ser maior que zero");
            }

            const itemExistente = await this.repository.buscarItemPorId(id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            const statusVenda = await this.repository.buscarStatusVenda(itemExistente.getVendaId());
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaPermiteAlteracaoDeItens(statusVenda)) {
                return new Error("Venda não permite alteração de itens");
            }

            const produto = await this.produtoRepository.buscarProdutoPorId(itemExistente.getProdutoId());
            if(!produto || produto === null) {
                return new Error("Produto não encontrado");
            }

            if(!produto.getIsActive()) {
                return new Error("Produto bloqueado não pode ser vendido");
            }

            const validade = produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return new Error("Produto vencido não pode ser vendido");
            }

            if(produto.getQuantidadeEstoque() < quantidade) {
                return new Error("Quantidade em estoque insuficiente");
            }

            const quantidadeMaxima = produto.getQuantidadeMaxima();
            if(produto.getClassificacao() !== Classificacao.LIVRE && quantidadeMaxima !== null && quantidade > quantidadeMaxima) {
                return new Error("Quantidade acima do limite permitido por receita");
            }

            itemExistente.alterarQuantidade(quantidade);

            if(produto.getClassificacao() !== Classificacao.LIVRE) {
                itemExistente.recusar();
            }

            const resultado = await this.repository.editarItem(itemExistente);
            if(!resultado) {
                return new Error("Erro ao atualizar quantidade do item");
            }
        } catch (error) {
            return new Error("Erro ao atualizar quantidade do item");
        }
    }

    public async removerItem(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!this.podeGerenciarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            const statusVenda = await this.repository.buscarStatusVenda(itemExistente.getVendaId());
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaPermiteAlteracaoDeItens(statusVenda)) {
                return new Error("Venda não permite alteração de itens");
            }

            const resultado = await this.repository.removerItem(id);
            if(!resultado) {
                return new Error("Erro ao remover item da venda");
            }
        } catch (error) {
            return new Error("Erro ao remover item da venda");
        }
    }

    public async aprovarItem(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!this.podeAvaliarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            if(itemExistente.getAprovadoFarmaceutico()) {
                return new Error("Item já aprovado");
            }

            const statusVenda = await this.repository.buscarStatusVenda(itemExistente.getVendaId());
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaEstaEmAvaliacao(statusVenda)) {
                return new Error("Venda não está em avaliação");
            }

            const produto = await this.produtoRepository.buscarProdutoPorId(itemExistente.getProdutoId());
            if(!produto || produto === null) {
                return new Error("Produto não encontrado");
            }

            const validade = produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return new Error("Produto vencido não pode ser liberado");
            }

            itemExistente.aprovar();

            const resultado = await this.repository.atualizarAprovacao(itemExistente);
            if(!resultado) {
                return new Error("Erro ao aprovar item da venda");
            }
        } catch (error) {
            return new Error("Erro ao aprovar item da venda");
        }
    }

    public async recusarItem(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(!this.podeAvaliarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            if(itemExistente.getAprovadoFarmaceutico()) {
                return new Error("Item já aprovado não pode ser recusado");
            }

            const statusVenda = await this.repository.buscarStatusVenda(itemExistente.getVendaId());
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaEstaEmAvaliacao(statusVenda)) {
                return new Error("Venda não está em avaliação");
            }

            const resultado = await this.repository.removerItem(itemExistente.getId());
            if(!resultado) {
                return new Error("Erro ao recusar item da venda");
            }
        } catch (error) {
            return new Error("Erro ao recusar item da venda");
        }
    }

    public async avaliarVenda(usuarioLogado: Usuario, vendaId: number, aprovado: boolean): Promise<void | Error> {
        try {
            if(!this.podeAvaliarItens(usuarioLogado)) {
                return new Error("Usuário não autorizado");
            }

            const statusVenda = await this.repository.buscarStatusVenda(vendaId);
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            if(!this.vendaEstaEmAvaliacao(statusVenda)) {
                return new Error("Venda não está em avaliação");
            }

            const itensPendentes = await this.repository.listarItensPendentes(vendaId);
            if(!itensPendentes || itensPendentes === null || itensPendentes.length === 0) {
                return new Error("Nenhum item pendente de avaliação");
            }

            if(aprovado) {
                for (const item of itensPendentes) {
                    item.aprovar();
                }

                const foramAprovados = await this.repository.atualizarAprovacaoEmLote(itensPendentes);
                if(!foramAprovados) {
                    return new Error("Erro ao avaliar itens da venda");
                }
            } else {
                const idsRecusados = itensPendentes.map((item) => item.getId());

                const foramRemovidos = await this.repository.removerItensEmLote(idsRecusados);
                if(!foramRemovidos) {
                    return new Error("Erro ao avaliar itens da venda");
                }
            }
        } catch (error) {
            return new Error("Erro ao avaliar itens da venda");
        }
    }

    public async calcularTotalVenda(usuarioLogado: Usuario, vendaId: number): Promise<number | Error> {
        try {
            const itens = await this.repository.listarItensVenda(vendaId);
            if(!itens || itens === null || itens.length === 0) {
                return new Error("Nenhum item encontrado na venda");
            }

            let total = 0;

            for (const item of itens) {
                const produto = await this.produtoRepository.buscarProdutoPorId(item.getProdutoId());
                if(!produto || produto === null) {
                    return new Error("Produto não encontrado");
                }

                total = total + item.calcularValorItem(produto.getPreco());
            }
            return Math.round(total * 100) / 100;
        } catch (error) {
            return new Error("Erro ao calcular total da venda");
        }
    }
}