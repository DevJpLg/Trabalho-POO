import Venda, { StatusVenda } from "../";
import Usuario from "../../usuario";
import EstadoVenda from "./index";

export default class FinalizadaState implements EstadoVenda {

    // ! Mostra pra Venda qual é o status atual (no formado de StatusVenda)
    public getStatus(): StatusVenda { return StatusVenda.FINALIZADA; }
    
    // ! Verificações se a classe está apta a fazer ... 
    public async podeAdicionarItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>  { return false; }
    public async podeRemoverItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>    { return false; }
    public async podeAvaliarVenda(venda: Venda, usuarioLogado: Usuario): Promise<boolean>   { return false; }

    // ! Não é possivel finalizar uma venda finalizada
    public async finalizarVenda(venda: Venda, usuarioLogado: Usuario): Promise<void> {
        throw new Error("Venda já finalizada, não é possivel finalizar novamente");
    }

    // ! Não é possivel cancelar uma venda finalizada
    public async cancelarVenda(venda: Venda): Promise<void> {
        throw new Error("Venda já finalizada, não é possivel cancelar");
    }

}
