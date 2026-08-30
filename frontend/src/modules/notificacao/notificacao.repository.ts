import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, NotificacaoDTO } from "../../shared/types/api";

export interface InterfaceNotificacaoRepository {
  listar(): Promise<NotificacaoDTO[]>;
  atender(id: number): Promise<MessageResponse>;
}

export class NotificacaoRepository implements InterfaceNotificacaoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(): Promise<NotificacaoDTO[]> {
    return this.http.get<NotificacaoDTO[]>("/notificacoes");
  }

  atender(id: number): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(`/notificacoes/${id}/atender`);
  }
}
