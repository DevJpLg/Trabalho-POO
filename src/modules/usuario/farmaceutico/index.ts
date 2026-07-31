import Usuario, { Perfil } from "../index";
import { randomInt } from "crypto";

export default class Farmaceutico extends Usuario {
    private numeroCRM: string;

    constructor(id: number, nome: string, email: string, senha: string, numeroCRM: string,) {
        super(id, nome, email, senha, Perfil.FARMACEUTICO);
        this.numeroCRM = numeroCRM;
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
