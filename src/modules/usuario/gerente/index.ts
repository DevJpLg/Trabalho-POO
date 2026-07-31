import Usuario, { Perfil } from "../index";
import { randomInt } from "crypto";

export default class Gerente extends Usuario {

    constructor(id: number, nome: string, email: string, senha: string,) {
        super(id, nome, email, senha, Perfil.GERENTE);
    }

    public static criarGerente(nome: string, email: string, senha: string): Gerente {
        if(!Usuario.validarUsuario(nome, email, senha)) {
            throw new Error("Usuario inválido");
        }

        const id = randomInt(1, 1000000);

        const gerente = new Gerente(id, nome, email, senha);

        return gerente;
    }
}
