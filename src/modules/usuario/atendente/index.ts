import Usuario, { Perfil } from "../index";
import { randomInt } from "crypto";

export default class Atendente extends Usuario {

    constructor(id: number, nome: string, email: string, senha: string, ehAtivo: boolean = true) {
        super(id, nome, email, senha, Perfil.ATENDENTE, ehAtivo);
    }

    public static criarAtendente(nome: string, email: string, senha: string): Atendente {
        if(!Usuario.validarUsuario(nome, email, senha)) {
            throw new Error("Usuario inválido");
        }

        const id = randomInt(1, 1000000);

        const atendente = new Atendente(id, nome, email, senha);

        return atendente;
    }

}
