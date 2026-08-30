import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, NotificacaoDTO } from "../../shared/types/api";
import type { InterfaceNotificacaoRepository } from "./notificacao.repository";

export interface InterfaceNotificacaoService {
  listar(): Promise<NotificacaoDTO[]>;
  atender(id: number): Promise<MessageResponse>;
}

export class NotificacaoService implements InterfaceNotificacaoService {
  constructor(private readonly repository: InterfaceNotificacaoRepository) {}

  listar(): Promise<NotificacaoDTO[]> {
    return listarTolerante(() => this.repository.listar());
  }

  atender(id: number): Promise<MessageResponse> {
    return this.repository.atender(id);
  }
}
