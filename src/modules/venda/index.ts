import crypto from "crypto";
import ItemVenda from "../itemVenda";
import Usuario, { Perfil } from "../usuario";
import EstadoVenda from "./state";
import EstadoVendaFactory from "./state/EstadoVendaFactory";

export enum StatusVenda {
    EM_ANDAMENTO = "EM_ANDAMENTO",
    EM_AVALIACAO = "EM_AVALIACAO",
    AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
    FINALIZADA = "FINALIZADA",
    CANCELADA = "CANCELADA",
}

export default class Venda {
    private id: number | null;
    private dataHora: Date;
    private estado: EstadoVenda; //Crio como estado pois ele é o objeto do State Method e ele tem o status dentro
    private idAtendente: number | null;
    private idFarmaceutico: number | null;
    private idCaixa: number | null;
    private valorTotal: number = 0;
    private itens: ItemVenda[]; //Lista de itens da venda

    constructor( id: number | null, dataHora: Date, estado: EstadoVenda, idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null) {
        this.id = id;
        this.dataHora = dataHora;
        this.estado = estado;
        this.idAtendente = idAtendente;
        this.idFarmaceutico = idFarmaceutico;
        this.idCaixa = idCaixa;
        this.valorTotal = 0;
        this.itens = [];
    }

    public getId(): number | null { return this.id; }
    public getDataHora(): Date { return this.dataHora; }
    public getStatus(): StatusVenda { return this.estado.getStatus(); } //Retorno apenas o status, não o objeto todo
    public getIdAtendente(): number | null { return this.idAtendente; }
    public getIdFarmaceutico(): number | null { return this.idFarmaceutico; }
    public getIdCaixa(): number | null { return this.idCaixa; }
    public getValorTotal(): number { return this.valorTotal; }
    public getItens(): ItemVenda[] { return this.itens; }

    public registrarFarmaceutico(usuarioLogado: Usuario): void {
        if (usuarioLogado.getPerfil() !== Perfil.FARMACEUTICO) {
            throw new Error("Somente o farmacêutico pode ser registrado na avaliação");
        }
        const id = usuarioLogado.getId();
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Farmacêutico inválido");
        }
        this.idFarmaceutico = id;
    }


    // ! Verificações se a venda está apta a ... //
    public podeAdicionarItem(usuarioLogado: Usuario): Promise<boolean> {
        return this.estado.podeAdicionarItem(this, usuarioLogado);
    }
    public podeRemoverItem(usuarioLogado: Usuario): Promise<boolean> {
        return this.estado.podeRemoverItem(this, usuarioLogado);
    }
    public podeAvaliarVenda(usuarioLogado: Usuario): Promise<boolean> {
        return this.estado.podeAvaliarVenda(this, usuarioLogado);
    }

    // ! Verificações auxiliares usadas para ver se a venda está apta
    // !     Poderia ser feito na service, mas preferimos não ficar fazendo busca no banco
    public existeItemPrescritoNaoAvaliado(): boolean {
        return this.itens.some(
            (item) => item.getExigeAvaliacao() && item.getAprovadoFarmaceutico() == false
        );
    }
    public temItemPrescrito(): boolean {
        return this.itens.some((item) => item.getExigeAvaliacao());
    }

    // ! Ações que podem ser realizadas na venda, só seguir ou cancelar //
    public finalizarVenda(usuarioLogado: Usuario): Promise<void | Error> {
        return this.estado.finalizarVenda(this, usuarioLogado);
    }
    public cancelarVenda(): Promise<void | Error> {
        return this.estado.cancelarVenda(this);
    }

    // ! Quando for alterar o estado ele é alterado dentro do state method e volta só o objeto pronto
    // !     Venda sabe apenas o primeiro estado, o resto é independente dela.
    public alterarEstado(estado: EstadoVenda): void {
        this.estado = estado;
    }

    // ! Quando vier do banco, tem que assosciar os itens e isso é papel de ItemVenda
    public associarItens(itens: ItemVenda[]): void {
        this.itens = itens;
        this.calcularValorTotal();
    }

    // ! Calcula o valor total da venda
    public calcularValorTotal(): number {
        this.valorTotal = this.itens.reduce(
            (total, itemVenda) => total + itemVenda.getPrecoSubtotal(), 0
        )
        return this.valorTotal;
    }

    // ! Cria uma venda nova, nenhuma outra classe pode fazer new Venda()
    // !     Alguns atributos são criados aqui, o que inclui o estado
    public static criarVenda(idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null): Venda {
        if(idAtendente == null && idCaixa == null) {
            throw new Error("Atendente ou caixa são obrigatórios");
        }

        const dataHora = new Date();
        const id = crypto.randomInt(1, 1000000);
        const estado = EstadoVendaFactory.criar(StatusVenda.EM_ANDAMENTO);

        return new Venda(id, dataHora, estado, idAtendente, idFarmaceutico, idCaixa);
    }

    public static rebuildVenda(id: number, dataHora: Date, status: StatusVenda, idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null): Venda {
        const estado = EstadoVendaFactory.criar(status);
        return new Venda(id, dataHora, estado, idAtendente, idFarmaceutico, idCaixa);
    }




}
