import Usuario from "../../usuario";
import InterfaceItemVendaRepository from "../itemVenda.repository";
import InterfaceAutorizacaoService from "../../usuario/autorizacao/autorizacao.service";

export default interface InterfaceValidacaoItemService {
    aprovarItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error>;
    recusarItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error>;
}

export class validacaoItemService implements InterfaceValidacaoItemService {
    private repository: InterfaceItemVendaRepository;
    private autorizacaoService: InterfaceAutorizacaoService;

    constructor(repository: InterfaceItemVendaRepository, autorizacaoService: InterfaceAutorizacaoService) {
        this.repository = repository;
        this.autorizacaoService = autorizacaoService;
    }

    /* ! ========== Aprovar Item (separar depois_)========== */
    public async aprovarItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeAvaliarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(vendaId, id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            if(itemExistente.getAprovadoFarmaceutico()) {
                return new Error("Item já aprovado");
            }

            itemExistente.registrarAvaliacao(true);
            if(!(await this.repository.atualizarAprovacao(itemExistente))) {
                return new Error("Erro ao aprovar item");
            }
        } catch (error) {
            return new Error("Erro ao aprovar item da venda");
        }
    }

    /* ! ========== Recusar Item (separar depois)========== */
    public async recusarItem(usuarioLogado: Usuario, vendaId: number, id: number): Promise<void | Error> {
        try {
            if(!(await this.autorizacaoService.usuarioPodeAvaliarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const itemExistente = await this.repository.buscarItemPorId(vendaId, id);
            if(!itemExistente || itemExistente === null) {
                return new Error("Item de venda não encontrado");
            }

            if(itemExistente.getAprovadoFarmaceutico()) {
                return new Error("Item já aprovado não pode ser recusado");
            }

            itemExistente.registrarAvaliacao(false);
            if(!(await this.repository.atualizarAprovacao(itemExistente))) {
                return new Error("Erro ao recusar item");
            }
        } catch (error) {
            return new Error("Erro ao recusar item da venda");
        }
    }
    
}
