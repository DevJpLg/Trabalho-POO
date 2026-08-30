import Notificacao from "..";
import Observer from "./index";

export default class FarmaceuticoObserver implements Observer {
    public async atualizar(_notificacao: Notificacao): Promise<void> {
    }
}
