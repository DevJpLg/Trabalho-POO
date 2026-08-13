
export default class Prescricao {
    private id: number;
    private numeroPrescricao: string;
    private nomeMedico: string;
    private numeroCrm: string;
    private ufCrm: string;
    private nomePaciente: string;
    private retencao: boolean;
    private dataEmissao: Date;
    private dataValidade: Date;
    private anexo: string;
    private retida: boolean;
    private vendaId: number;

    constructor( id: number, numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number) {
        this.id = id;
        this.numeroPrescricao = numeroPrescricao;
        this.nomeMedico = nomeMedico;
        this.numeroCrm = numeroCrm;
        this.ufCrm = ufCrm;
        this.nomePaciente = nomePaciente;
        this.retencao = retencao;
        this.dataEmissao = dataEmissao;
        this.dataValidade = dataValidade;
        this.anexo = anexo;
        this.retida = retida;
        this.vendaId = vendaId;
    }

    public getId(): number { return this.id; }
    public getNumeroPrescricao(): string { return this.numeroPrescricao; }
    public getNomeMedico(): string { return this.nomeMedico; }
    public getNumeroCrm(): string { return this.numeroCrm; }
    public getUfCrm(): string { return this.ufCrm; }
    public getNomePaciente(): string { return this.nomePaciente; }
    public getRetencao(): boolean { return this.retencao; }
    public getDataEmissao(): Date { return this.dataEmissao; }
    public getDataValidade(): Date { return this.dataValidade; }
    public getAnexo(): string { return this.anexo; }
    public getRetida(): boolean { return this.retida; }
    public getVendaId(): number { return this.vendaId; }
}