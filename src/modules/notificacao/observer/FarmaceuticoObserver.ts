import Notificacao, { TipoNotificacao } from "..";
import Observer from "./index";

export default class FarmaceuticoObserver implements Observer {
    public async atualizar(notificacao: Notificacao): Promise<void> {
        if (notificacao.getTipo() !== TipoNotificacao.VENDA_PRESCRITA) {
            return;
        }
    }
}
