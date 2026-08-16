import crypto from "crypto";

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


    //Com ela, nenhuma classe vai fazer "new Prescricao"
    public static criarPrescricao(numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Prescricao {
        if (numeroPrescricao === "" || numeroPrescricao === null ||
            nomeMedico === "" || nomeMedico === null ||
            numeroCrm === "" || numeroCrm === null ||
            ufCrm === "" || ufCrm === null) {
            throw new Error("Dados obrigatórios não informados");
        }

        if(nomePaciente === "" || nomePaciente === null) {
            throw new Error("Nome do paciente não informado");
        }

        if(dataEmissao === null || dataValidade === null) { //Verificações de data não são feitas na entidade, apenas no service
            throw new Error("Data de emissão ou validade não informada");
        }

        if(vendaId === null) {
            throw new Error("Venda inválida");
        }

        //Deveria ser mais bem feito, mas como a variavel foi setada para int não da pra por uuid
        const id = crypto.randomInt(1, 1000000);

        return new Prescricao(id, numeroPrescricao, nomeMedico, numeroCrm, ufCrm, nomePaciente, retencao, dataEmissao, dataValidade, anexo, retida, vendaId);
    }


    //Essa classe serve para a mesma coisa que a criarPrescricao, mas quando os dados vem do banco, não precisa verificar nada
    public static rebuildPrescricao(id: number, numeroPrescricao: string, nomeMedico: string, numeroCrm: string, ufCrm: string, nomePaciente: string, retencao: boolean, dataEmissao: Date, dataValidade: Date, anexo: string, retida: boolean, vendaId: number): Prescricao {
        return new Prescricao(id, numeroPrescricao, nomeMedico, numeroCrm, ufCrm, nomePaciente, retencao, dataEmissao, dataValidade, anexo, retida, vendaId);
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