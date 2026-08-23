import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, PrescricaoDTO, PrescricaoInput } from "../../shared/types/api";
import type { InterfacePrescricaoRepository } from "./prescricao.repository";

export interface InterfacePrescricaoService {
  /** Lista tudo e aplica o filtro textual no cliente. */
  listar(busca?: string): Promise<PrescricaoDTO[]>;
  listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]>;
  buscarPorId(id: number): Promise<PrescricaoDTO>;
  cadastrar(dados: PrescricaoInput): Promise<MessageResponse>;
  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<MessageResponse>;
}

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function combina(prescricao: PrescricaoDTO, termo: string): boolean {
  const alvo = [
    prescricao.numeroPrescricao,
    prescricao.nomeMedico,
    prescricao.numeroCrm,
    prescricao.ufCrm,
    prescricao.nomePaciente,
    prescricao.vendaId,
  ]
    .map(normalizar)
    .join(" ");

  return alvo.includes(termo);
}

export class PrescricaoService implements InterfacePrescricaoService {
  constructor(private readonly repository: InterfacePrescricaoRepository) {}

  /**
   * A rota de listagem só aceita data como filtro (ver `prescricao.repository`),
   * então trazemos tudo e filtramos aqui. O volume de prescrições de uma farmácia
   * de bairro comporta bem esse caminho.
   */
  async listar(busca = ""): Promise<PrescricaoDTO[]> {
    const todas = await listarTolerante(() => this.repository.listar());
    const termo = normalizar(busca).trim();
    if (termo === "") return todas;
    return todas.filter((prescricao) => combina(prescricao, termo));
  }

  /** Filtra no cliente porque `GET /prescricoes/venda/:id` está quebrada no backend. */
  async listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]> {
    const todas = await listarTolerante(() => this.repository.listar());
    return todas.filter((prescricao) => Number(prescricao.vendaId) === vendaId);
  }

  buscarPorId(id: number): Promise<PrescricaoDTO> {
    return this.repository.buscarPorId(id);
  }

  cadastrar(dados: PrescricaoInput): Promise<MessageResponse> {
    return this.repository.cadastrar(dados);
  }

  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse> {
    return this.repository.editar(id, dados);
  }

  deletar(id: number): Promise<MessageResponse> {
    return this.repository.deletar(id);
  }
}
