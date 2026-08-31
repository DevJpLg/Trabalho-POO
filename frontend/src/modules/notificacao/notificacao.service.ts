import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, NotificacaoDTO } from "../../shared/types/api";
import type { InterfaceNotificacaoRepository } from "./notificacao.repository";

export interface InterfaceNotificacaoService {
  listar(): Promise<NotificacaoDTO[]>;
  atender(id: number): Promise<MessageResponse>;
  atenderPorVenda(vendaId: number): Promise<void>;
}

export class NotificacaoService implements InterfaceNotificacaoService {
  constructor(private readonly repository: InterfaceNotificacaoRepository) {}

  listar(): Promise<NotificacaoDTO[]> {
    return listarTolerante(() => this.repository.listar());
  }

  atender(id: number): Promise<MessageResponse> {
    return this.repository.atender(id);
  }

  async atenderPorVenda(vendaId: number): Promise<void> {
    const aberta = (await this.listar()).find((item) => item.vendaId === vendaId);
    if (!aberta) return;
    await this.atender(aberta.id);
  }
}
