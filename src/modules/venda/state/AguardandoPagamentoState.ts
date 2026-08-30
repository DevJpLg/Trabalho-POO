import Venda, { StatusVenda } from "../";
import Usuario from "../../usuario";

import EstadoVenda from "./index";
import EstadoVendaFactory from "./EstadoVendaFactory";

export default class AguardandoPagamentoState implements EstadoVenda {

    // ! Mostra pra Venda qual é o status atual (no formado de StatusVenda)
    public getStatus(): StatusVenda { return StatusVenda.AGUARDANDO_PAGAMENTO; }
    
    // ! Verificações se a classe está apta a fazer ... 
    public async podeAdicionarItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>  { return false; }
    public async podeRemoverItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>    { return false; }
    public async podeAvaliarVenda(venda: Venda, usuarioLogado: Usuario): Promise<boolean>   { return false; }

    // ! Ao finalizar uma venda que está aguardando pagamento, levamos em conta que o caixa recebeu o dinheiro do cliente
    public async finalizarVenda(venda: Venda, usuarioLogado: Usuario): Promise<void> {
        if(venda.getItens().length === 0)                                            { throw new Error("Venda não tem itens"); }
        if(venda.getIdAtendente() == null && venda.getIdCaixa() == null)             { throw new Error("Venda não tem atendente ou caixa"); }
        if(venda.getValorTotal() <= 0)                                               { throw new Error("Venda não tem valor total"); }
        if(venda.existeItemPrescritoNaoAvaliado() == true)                           { throw new Error("Ainda existem itens prescritos não avaliados"); }
        if(venda.temItemPrescrito() == true && venda.getIdFarmaceutico() == null)    { throw new Error("Venda não tem farmaceutico"); }

        venda.alterarEstado(EstadoVendaFactory.criar(StatusVenda.FINALIZADA));
    }

    // ! Pode cancelare a qualquer momento
    public async cancelarVenda(venda: Venda): Promise<void> {
        venda.alterarEstado(EstadoVendaFactory.criar(StatusVenda.CANCELADA));
    }

}
