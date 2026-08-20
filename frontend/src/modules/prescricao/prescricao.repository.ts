import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, PrescricaoDTO, PrescricaoInput } from "../../shared/types/api";

export interface InterfacePrescricaoRepository {
  listar(busca?: string): Promise<PrescricaoDTO[]>;
  listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]>;
  buscarPorId(id: number): Promise<PrescricaoDTO>;
  cadastrar(dados: PrescricaoInput): Promise<MessageResponse>;
  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<MessageResponse>;
}

export class PrescricaoRepository implements InterfacePrescricaoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(busca = ""): Promise<PrescricaoDTO[]> {
    return this.http.get<PrescricaoDTO[]>("/prescricoes", { busca });
  }

  listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]> {
    return this.http.get<PrescricaoDTO[]>(`/prescricoes/venda/${vendaId}`);
  }

  buscarPorId(id: number): Promise<PrescricaoDTO> {
    return this.http.get<PrescricaoDTO>(`/prescricoes/${id}`);
  }

  cadastrar(dados: PrescricaoInput): Promise<MessageResponse> {
    return this.http.post<MessageResponse>("/prescricoes", dados);
  }

  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/prescricoes/${id}`, dados);
  }

  deletar(id: number): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/prescricoes/${id}`);
  }
}
