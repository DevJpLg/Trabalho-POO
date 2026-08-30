import Venda, { StatusVenda } from "../";
import Usuario from "../../usuario";
import EstadoVenda from "./index";

export default class CanceladaState implements EstadoVenda {

    // ! Mostra pra Venda qual é o status atual (no formado de StatusVenda)
    public getStatus(): StatusVenda { return StatusVenda.CANCELADA; }
    
    // ! Verificações se a classe está apta a fazer ... 
    public async podeAdicionarItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>  { return false; }
    public async podeRemoverItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>    { return false; }
    public async podeAvaliarVenda(venda: Venda, usuarioLogado: Usuario): Promise<boolean>   { return false; }

    // ! Não é possivel finalizar uma venda cancelada
    public async finalizarVenda(venda: Venda, usuarioLogado: Usuario): Promise<void> {
        throw new Error("Venda cancelada, não é possivel finalizar");
    }

    // ! Não é possivel cancelar uma venda cancelada
    public async cancelarVenda(venda: Venda): Promise<void> {
        throw new Error("Venda já está cancelada");
    }

}
