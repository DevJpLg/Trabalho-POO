import Usuario, { Perfil } from "../index";
import { randomInt } from "crypto";

export default class Caixa extends Usuario {

    constructor(id: number, nome: string, email: string, senha: string, ehAtivo: boolean = true) {
        super(id, nome, email, senha, Perfil.CAIXA, ehAtivo);
    }

    public static criarCaixa(nome: string, email: string, senha: string): Caixa {
        if(!Usuario.validarUsuario(nome, email, senha)) {
            throw new Error("Usuario inválido");
        }

        const id = randomInt(1, 1000000);

        const caixa = new Caixa(id, nome, email, senha);

        return caixa;
    }
}
