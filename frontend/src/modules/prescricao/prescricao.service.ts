import type { MessageResponse, PrescricaoDTO, PrescricaoInput } from "../../shared/types/api";
import type { InterfacePrescricaoRepository } from "./prescricao.repository";

export interface InterfacePrescricaoService {
  listar(busca?: string): Promise<PrescricaoDTO[]>;
  listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]>;
  buscarPorId(id: number): Promise<PrescricaoDTO>;
  cadastrar(dados: PrescricaoInput): Promise<MessageResponse>;
  editar(id: number, dados: PrescricaoInput): Promise<MessageResponse>;
  deletar(id: number): Promise<MessageResponse>;
}

export class PrescricaoService implements InterfacePrescricaoService {
  constructor(private readonly repository: InterfacePrescricaoRepository) {}

  listar(busca = ""): Promise<PrescricaoDTO[]> {
    return this.repository.listar(busca);
  }

  listarPorVenda(vendaId: number): Promise<PrescricaoDTO[]> {
    return this.repository.listarPorVenda(vendaId);
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
