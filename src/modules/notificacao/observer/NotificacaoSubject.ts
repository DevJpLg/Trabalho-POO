import Notificacao from "..";
import Observer from "./index";
import Subject from "./Subject";

export default class NotificacaoSubject implements Subject {
    private observers: Observer[] = [];

    public adicionarObserver(observer: Observer): void {
        if (this.observers.includes(observer)) {
            return;
        }
        this.observers.push(observer);
    }

    public removerObserver(observer: Observer): void {
        this.observers = this.observers.filter((observadorRegistrado) => observadorRegistrado !== observer);
    }

    public async notificarObservers(notificacao: Notificacao): Promise<void> {
        for (const observer of this.observers) {
            await observer.atualizar(notificacao);
        }
    }
}
