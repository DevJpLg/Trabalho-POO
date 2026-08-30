import Notificacao from "..";

export default interface Observer {
    atualizar(notificacao: Notificacao): Promise<void>;
}
