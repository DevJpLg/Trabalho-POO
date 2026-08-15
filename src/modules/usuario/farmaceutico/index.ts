import Usuario, { Perfil } from "../index";
import ItemVenda from "../../itemVenda";
import { Classificacao } from "../../produto";
import { randomInt } from "crypto";

export default class Farmaceutico extends Usuario {
    private numeroCRM: string;

    constructor(id: number, nome: string, email: string, senha: string, numeroCRM: string,) {
        super(id, nome, email, senha, Perfil.FARMACEUTICO);
        this.numeroCRM = numeroCRM;
    }

    public aprovarItem(item: ItemVenda): void {
        if(item.getAprovadoFarmaceutico()) {
            throw new Error("Item já aprovado");
        }
        item.registrarAvaliacao(true);
    }

    public recusarItem(item: ItemVenda): void {
        if(item.getAprovadoFarmaceutico()) {
            throw new Error("Item já aprovado não pode ser recusado");
        }
        item.registrarAvaliacao(false);
    }

    public avaliarVenda(itens: ItemVenda[], aprovado: boolean): void {
        for (const item of itens) {
            if(aprovado) {
                this.aprovarItem(item);
            } else {
                this.recusarItem(item);
            }
        }
    }

    // Medicamento de venda livre não passa pelo farmacêutico.
    public static exigeAvaliacao(classificacao: Classificacao): boolean {
        return classificacao !== Classificacao.LIVRE;
    }

    public static criarFarmaceutico(nome: string, email: string, senha: string, numeroCRM: string): Farmaceutico {
        if(!Usuario.validarUsuario(nome, email, senha)) {
            throw new Error("Usuario inválido");
        }

        if(numeroCRM === "") {
            throw new Error("Número CRM inválido");
        }

        const id = randomInt(1, 1000000);

        const farmaceutico = new Farmaceutico(id, nome, email, senha, numeroCRM);

        return farmaceutico;
    }

}
