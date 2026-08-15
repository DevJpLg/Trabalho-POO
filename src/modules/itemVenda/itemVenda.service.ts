import { InterfaceItemVendaRepository } from "./itemVenda.repository";
import InterfaceConsultaProduto from "./produto";
import ItemVenda from "./index";
import { StatusVenda } from "../venda";
import Usuario, { Perfil } from "../usuario";
import Farmaceutico from "../usuario/farmaceutico";
export interface InterfaceItemVendaService {
    adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<number | Error>;
    listarItensVenda(usuarioLogado: Usuario, vendaId: number, busca?: string): Promise<ItemVenda[] | Error>;
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

    private podeAvaliarItens(usuarioLogado: Usuario): usuarioLogado is Farmaceutico {
        return usuarioLogado instanceof Farmaceutico;
    }

    private vendaPermiteAlteracaoDeItens(statusVenda: StatusVenda): boolean {
        return statusVenda === StatusVenda.EM_ANDAMENTO || statusVenda === StatusVenda.AGUARDANDO_PAGAMENTO;
    }

    private vendaEstaEmAvaliacao(statusVenda: StatusVenda): boolean {
        return statusVenda === StatusVenda.EM_AVALIACAO;
    }

    public async adicionarItem(usuarioLogado: Usuario, vendaId: number, produtoId: number, quantidade: number): Promise<number | Error> {
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

            const exigeAvaliacao = Farmaceutico.exigeAvaliacao(produto.getClassificacao());
            const quantidadeMaxima = produto.getQuantidadeMaxima();

            const itemExistente = await this.repository.buscarItemPorVendaEProduto(vendaId, produtoId);

            // Produto já está na venda: soma na quantidade do item em vez de duplicar a linha.
            if(itemExistente) {
                const quantidadeAtual = itemExistente.getQuantidade();
                const quantidadeTotal = quantidadeAtual + quantidade;
                const estavaAprovado = itemExistente.getAprovadoFarmaceutico();

                // Item aprovado já saiu do estoque, então só o que está entrando agora precisa estar disponível.
                const quantidadeNecessaria = estavaAprovado ? quantidade : quantidadeTotal;
                if(produto.getQuantidadeEstoque() < quantidadeNecessaria) {
                    return new Error("Quantidade em estoque insuficiente");
                }

                if(exigeAvaliacao && quantidadeMaxima !== null && quantidadeTotal > quantidadeMaxima) {
                    return new Error("Quantidade acima do limite permitido por receita");
                }

                // Mudou a quantidade de um controlado: precisa passar de novo pelo farmacêutico.
                if(exigeAvaliacao) {
                    itemExistente.registrarAvaliacao(false);
                }

                const foiSomado = await this.repository.adicionarQuantidadeItem(itemExistente, quantidade);
                if(!foiSomado) {
                    return new Error("Erro ao adicionar item à venda");
                }

                if(exigeAvaliacao && estavaAprovado) {
                    // Voltou para a fila de avaliação: o que já tinha saído do estoque volta.
                    const foiDevolvido = await this.produtoRepository.realizarEntrada(produto, quantidadeAtual);
                    if(!foiDevolvido) {
                        return new Error("Erro ao devolver quantidade ao estoque");
                    }
                } else if(!exigeAvaliacao) {
                    // Venda livre continua aprovada: a quantidade nova sai do estoque na hora.
                    const foiBaixado = await this.produtoRepository.realizarBaixa(produtoId, quantidade);
                    if(!foiBaixado) {
                        return new Error("Erro ao dar baixa no estoque");
                    }
                }

                return itemExistente.getId();
            }

            if(produto.getQuantidadeEstoque() < quantidade) {
                return new Error("Quantidade em estoque insuficiente");
            }

            if(exigeAvaliacao && quantidadeMaxima !== null && quantidade > quantidadeMaxima) {
                return new Error("Quantidade acima do limite permitido por receita");
            }

            const itemCriado = ItemVenda.criarItemVenda({
                quantidade: quantidade,
                vendaId: vendaId,
                produtoId: produtoId,
                produto: produto,
                aprovadoFarmaceutico: !exigeAvaliacao,
            });
            if(!itemCriado) {
                return new Error("Erro ao criar item de venda");
            }

            const idCriado = await this.repository.adicionarItem(itemCriado);
            if(idCriado === null) {
                return new Error("Erro ao adicionar item à venda");
            }

            // Item de venda livre já nasce aprovado, então a baixa no estoque acontece junto.
            if(!exigeAvaliacao) {
                const foiBaixado = await this.produtoRepository.realizarBaixa(produtoId, quantidade);
                if(!foiBaixado) {
                    return new Error("Erro ao dar baixa no estoque");
                }
            }

            return idCriado;

        } catch (error) {
            return new Error("Erro ao adicionar item à venda");
        }
    }

    public async listarItensVenda(usuarioLogado: Usuario, vendaId: number, busca: string = ""): Promise<ItemVenda[] | Error> {
        try {
            const statusVenda = await this.repository.buscarStatusVenda(vendaId);
            if(statusVenda === null) {
                return new Error("Venda não encontrada");
            }

            const resultado = await this.repository.listarItensVenda(vendaId, busca);
            if(!resultado || resultado === null || resultado.length === 0) {
                return new Error("Nenhum item encontrado na venda");
            }

            for (const item of resultado) {
                item.calcularValorItem();
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

            resultado.calcularValorItem();
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

            const produto = itemExistente.getProduto();
            if(produto === null) {
                return new Error("Produto não encontrado");
            }

            if(!produto.getIsActive()) {
                return new Error("Produto bloqueado não pode ser vendido");
            }

            const validade = produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return new Error("Produto vencido não pode ser vendido");
            }

            const quantidadeAtual = itemExistente.getQuantidade();
            const diferenca = quantidade - quantidadeAtual;
            if(diferenca === 0) {
                return;
            }

            const estavaAprovado = itemExistente.getAprovadoFarmaceutico();
            const exigeAvaliacao = Farmaceutico.exigeAvaliacao(produto.getClassificacao());

            const quantidadeNecessaria = estavaAprovado ? diferenca : quantidade;
            if(diferenca > 0 && produto.getQuantidadeEstoque() < quantidadeNecessaria) {
                return new Error("Quantidade em estoque insuficiente");
            }

            const quantidadeMaxima = produto.getQuantidadeMaxima();
            if(exigeAvaliacao && quantidadeMaxima !== null && quantidade > quantidadeMaxima) {
                return new Error("Quantidade acima do limite permitido por receita");
            }

            itemExistente.alterarQuantidade(quantidade);

            if(exigeAvaliacao) {
                itemExistente.registrarAvaliacao(false);
            }

            const foiGravado = diferenca > 0
                ? await this.repository.adicionarQuantidadeItem(itemExistente, diferenca)
                : await this.repository.removerQuantidadeItem(itemExistente, -diferenca);
            if(!foiGravado) {
                return new Error("Erro ao atualizar quantidade do item");
            }

            if(exigeAvaliacao && estavaAprovado) {
                const foiDevolvido = await this.produtoRepository.realizarEntrada(produto, quantidadeAtual);
                if(!foiDevolvido) {
                    return new Error("Erro ao devolver quantidade ao estoque");
                }
            } else if(!exigeAvaliacao) {
                const foiAjustado = diferenca > 0
                    ? await this.produtoRepository.realizarBaixa(produto.getId(), diferenca)
                    : await this.produtoRepository.realizarEntrada(produto, -diferenca);
                if(!foiAjustado) {
                    return new Error("Erro ao ajustar estoque do produto");
                }
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

            const produto = itemExistente.getProduto();
            const estavaAprovado = itemExistente.getAprovadoFarmaceutico();
            if(estavaAprovado && produto === null) {
                return new Error("Produto não encontrado");
            }

            const resultado = await this.repository.removerItem(itemExistente);
            if(!resultado) {
                return new Error("Erro ao remover item da venda");
            }

            if(estavaAprovado && produto !== null) {
                const foiDevolvido = await this.produtoRepository.realizarEntrada(produto, itemExistente.getQuantidade());
                if(!foiDevolvido) {
                    return new Error("Erro ao devolver quantidade ao estoque");
                }
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

            const produto = itemExistente.getProduto();
            if(produto === null) {
                return new Error("Produto não encontrado");
            }

            const validade = produto.getValidade();
            if(validade !== null && validade < new Date()) {
                return new Error("Produto vencido não pode ser liberado");
            }

            if(produto.getQuantidadeEstoque() < itemExistente.getQuantidade()) {
                return new Error("Quantidade em estoque insuficiente");
            }

            usuarioLogado.aprovarItem(itemExistente);

            const resultado = await this.repository.atualizarAprovacao(itemExistente);
            if(!resultado) {
                return new Error("Erro ao aprovar item da venda");
            }

            const foiBaixado = await this.produtoRepository.realizarBaixa(produto.getId(), itemExistente.getQuantidade());
            if(!foiBaixado) {
                return new Error("Erro ao dar baixa no estoque");
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

            usuarioLogado.recusarItem(itemExistente);

            const resultado = await this.repository.removerItem(itemExistente);
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
                    const produto = item.getProduto();
                    if(produto === null) {
                        return new Error("Produto não encontrado");
                    }

                    if(produto.getQuantidadeEstoque() < item.getQuantidade()) {
                        return new Error("Quantidade em estoque insuficiente");
                    }
                }
            }

            usuarioLogado.avaliarVenda(itensPendentes, aprovado);

            for (const item of itensPendentes) {
                if(aprovado) {
                    const foiGravado = await this.repository.atualizarAprovacao(item);
                    if(!foiGravado) {
                        return new Error("Erro ao avaliar itens da venda");
                    }

                    const foiBaixado = await this.produtoRepository.realizarBaixa(item.getProdutoId(), item.getQuantidade());
                    if(!foiBaixado) {
                        return new Error("Erro ao dar baixa no estoque");
                    }
                } else {
                    const foiGravado = await this.repository.removerItem(item);
                    if(!foiGravado) {
                        return new Error("Erro ao avaliar itens da venda");
                    }
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
                if(item.getProduto() === null) {
                    return new Error("Produto não encontrado");
                }

                item.calcularValorItem();

                total = total + item.getPreco();
            }
            return Math.round(total * 100) / 100;
        } catch (error) {
            return new Error("Erro ao calcular total da venda");
        }
    }
}