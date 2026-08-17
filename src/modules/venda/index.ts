import ItemVenda from "../itemVenda";

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
    private status: StatusVenda;
    private idAtendente: number | null;
    private idFarmaceutico: number | null;
    private idCaixa: number | null;
    private valorTotal: number = 0;
    private itens: ItemVenda[];

    constructor( id: number | null, dataHora: Date, status: StatusVenda, idAtendente: number | null, idFarmaceutico: number | null, idCaixa: number | null) {
        this.id = id;
        this.dataHora = dataHora;
        this.status = status;
        this.idAtendente = idAtendente;
        this.idFarmaceutico = idFarmaceutico;
        this.idCaixa = idCaixa;
        this.valorTotal = 0;
        this.itens = [];
    }

    public getId(): number | null { return this.id; }
    public getDataHora(): Date { return this.dataHora;}
    public getStatus(): StatusVenda { return this.status;}
    public getIdAtendente(): number | null { return this.idAtendente; }
    public getIdFarmaceutico(): number | null { return this.idFarmaceutico; }
    public getIdCaixa(): number | null { return this.idCaixa; }
    public getValorTotal(): number { return this.valorTotal; }
    public getItens(): ItemVenda[] { return this.itens; }
    

    public adicionarItem(item: ItemVenda): void {
        if(this.status !== StatusVenda.EM_ANDAMENTO) {
            throw new Error("Não é possível adicionar itens a uma venda que não está aberta");
        }

        this.itens.push(item);
        this.calcularValorTotal();
    }


    public removerItem(item: ItemVenda): void {
        if(this.status !== StatusVenda.EM_ANDAMENTO) {
            throw new Error("Não é possível remover itens de uma venda que não está aberta");
        }

        this.itens = this.itens.filter(itemVenda => itemVenda.getId() !== item.getId());
        this.calcularValorTotal();
    }


    public calcularValorTotal(): void {
        this.valorTotal = this.itens.reduce(
            (total, itemVenda) => total + itemVenda.getPrecoSubtotal(), 0
        )
    }
}