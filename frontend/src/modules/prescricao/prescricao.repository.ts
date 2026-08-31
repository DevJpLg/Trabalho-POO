import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import type { MessageResponse, PrescricaoDTO, PrescricaoInput } from "../../shared/types/api";

/**
 * `GET /prescricoes` monta o filtro com `new Date(busca)` sem validar a entrada.
 * Com `busca` vazia ou textual isso vira `Invalid Date` e a consulta quebra
 * (400 "Erro ao listar prescrições").
 *
 * Mandar uma data válida e bem antiga resolve sem tocar no backend: o `OR` do
 * repositório inclui `dataEmissao >= busca`, que casa com todo registro. A busca
 * por texto é então feita no cliente (ver `prescricao.service`).
 */
const BUSCA_TODAS = "1900-01-01";

/**
 * Rotas não usadas de propósito (ver ERROS_BACKEND.md):
 *  - `GET /prescricoes/venda/:vendaId` chama `vendaService.buscarVendaPorId`, que
 *    não existe em `VendaService` — sempre 400.
 *  - `GET /prescricoes/numero/:numero` está registrada depois de `GET /:id`, então
 *    o Express casa com `/:id` e tenta `Number("numero")`.
 */
export interface InterfacePrescricaoRepository {
  listar(): Promise<PrescricaoDTO[]>;
  buscarPorId(id: number): Promise<PrescricaoDTO>;
  cadastrar(dados: PrescricaoInput, arquivo: File): Promise<MessageResponse>;
  baixarArquivo(id: number): Promise<Blob>;
  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<MessageResponse>;
}

export class PrescricaoRepository implements InterfacePrescricaoRepository {
  constructor(private readonly http: InterfaceHttpClient) {}

  listar(): Promise<PrescricaoDTO[]> {
    return this.http.get<PrescricaoDTO[]>("/prescricoes", { busca: BUSCA_TODAS });
  }

  buscarPorId(id: number): Promise<PrescricaoDTO> {
    return this.http.get<PrescricaoDTO>(`/prescricoes/${id}`);
  }

  cadastrar(dados: PrescricaoInput, arquivo: File): Promise<MessageResponse> {
    const form = new FormData();
    form.append("numeroPrescricao", dados.numeroPrescricao);
    form.append("nomeMedico", dados.nomeMedico);
    form.append("numeroCrm", dados.numeroCrm);
    form.append("ufCrm", dados.ufCrm);
    form.append("nomePaciente", dados.nomePaciente);
    form.append("retencao", String(dados.retencao));
    form.append("dataEmissao", dados.dataEmissao);
    form.append("dataValidade", dados.dataValidade);
    form.append("retida", String(dados.retida));
    form.append("vendaId", String(dados.vendaId));
    form.append("arquivo", arquivo);
    return this.http.postForm<MessageResponse>("/prescricoes", form);
  }

  baixarArquivo(id: number): Promise<Blob> {
    return this.http.getBlob(`/prescricoes/${id}/arquivo`);
  }

  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/prescricoes/${id}`, dados);
  }

  deletar(id: number): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/prescricoes/${id}`);
  }
}
