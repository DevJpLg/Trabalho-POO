import EstadoVenda from ".";
import { StatusVenda } from "..";
import EmAndamentoState from "./EmAndamentoState";
import EmAvaliacaoState from "./EmAvaliacaoState";
import AguardandoPagamentoState from "./AguardandoPagamentoState";
import FinalizadaState from "./FinalizadaState";
import CanceladaState from "./CanceladaState";

export default class EstadoVendaFactory {
    public static criar(status: StatusVenda): EstadoVenda {
        switch (status) {
            case StatusVenda.EM_ANDAMENTO:
                return new EmAndamentoState();

            case StatusVenda.EM_AVALIACAO:
                return new EmAvaliacaoState();

            case StatusVenda.AGUARDANDO_PAGAMENTO:
                return new AguardandoPagamentoState();

            case StatusVenda.FINALIZADA:
                return new FinalizadaState();

            case StatusVenda.CANCELADA:
                return new CanceladaState();

            default:
                throw new Error("Estado de venda desconhecido");
        }
    }
}