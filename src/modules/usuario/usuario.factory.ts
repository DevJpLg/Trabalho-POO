import Usuario, { Perfil } from "./index";
import Gerente from "./gerente";
import Atendente from "./atendente";
import Farmaceutico from "./farmaceutico";
import Caixa from "./caixa";

export default interface InterfaceUsuarioFactory {
    rebuildUsuario(id: number, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Usuario;
}

export default class UsuarioFactory implements InterfaceUsuarioFactory {

    public rebuildUsuario(id: number, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Usuario {
        switch (perfil) {
            case Perfil.GERENTE:
                return new Gerente(id, nome, email, senha);
            case Perfil.ATENDENTE:
                return new Atendente(id, nome, email, senha);
            case Perfil.FARMACEUTICO:
                return new Farmaceutico(id, nome, email, senha, numeroCRM!);
            case Perfil.CAIXA:
                return new Caixa(id, nome, email, senha);
        }
    }

    public criarUsuario(nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Usuario {
        switch (perfil) {
            case Perfil.GERENTE:
                return Gerente.criarGerente(nome, email, senha);
            case Perfil.ATENDENTE:
                return Atendente.criarAtendente(nome, email, senha);
            case Perfil.FARMACEUTICO:
                return Farmaceutico.criarFarmaceutico(nome, email, senha, numeroCRM!);
            case Perfil.CAIXA:
                return Caixa.criarCaixa(nome, email, senha);
        }
    }
}
