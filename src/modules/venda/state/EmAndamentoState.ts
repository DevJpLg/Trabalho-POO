import Venda, { StatusVenda } from "../";
import Usuario from "../../usuario";

import EstadoVenda from "./index";
import EstadoVendaFactory from "./EstadoVendaFactory";

export default class EmAndamentoState implements EstadoVenda {

    // ! Mostra pra Venda qual é o status atual (no formado de StatusVenda)
    public getStatus(): StatusVenda { return StatusVenda.EM_ANDAMENTO; }
    
    // ! Verificações se a classe está apta a fazer ... 
    public async podeAdicionarItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>  { return true; }
    public async podeRemoverItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>    { return true; }
    public async podeAvaliarVenda(venda: Venda, usuarioLogado: Usuario): Promise<boolean>   { return false; }

    // ! Pede para finalizar:
    // !    Se tiver item prescrito -> avaliação.
    // !    Se não tiver item prescrito -> aguardando pagamento
    public async finalizarVenda(venda: Venda, usuarioLogado: Usuario): Promise<void> {
        if(venda.getItens().length === 0) {
            throw new Error("Venda não tem itens");
        }

        if(venda.existeItemPrescritoNaoAvaliado() == true) {
            venda.alterarEstado(EstadoVendaFactory.criar(StatusVenda.EM_AVALIACAO));
        } else {
            venda.alterarEstado(EstadoVendaFactory.criar(StatusVenda.AGUARDANDO_PAGAMENTO));
        }
    }

    // ! Pode cancelare a qualquer momento
    public async cancelarVenda(venda: Venda): Promise<void> {
        venda.alterarEstado(EstadoVendaFactory.criar(StatusVenda.CANCELADA));
    }

}
