import Notificacao from "..";
import Observer from "./index";

export default interface Subject {
    adicionarObserver(observer: Observer): void;
    removerObserver(observer: Observer): void;
    notificarObservers(notificacao: Notificacao): Promise<void>;
}
