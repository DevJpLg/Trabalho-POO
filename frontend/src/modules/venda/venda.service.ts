import { listarTolerante } from "../../shared/http/getErrorMessage";
import type { MessageResponse, StatusVenda, UsuarioDTO, VendaDTO } from "../../shared/types/api";
import type { InterfaceVendaRepository, VendaRegistroInput } from "./venda.repository";

export interface InterfaceVendaService {
  listar(status?: StatusVenda): Promise<VendaDTO[]>;
  /** Vendas que ainda aceitam alteração de itens pelo atendente. */
  listarEmAndamento(): Promise<VendaDTO[]>;
  /** Vendas aguardando validação do farmacêutico. */
  listarEmAvaliacao(): Promise<VendaDTO[]>;
  registrar(dados: VendaRegistroInput): Promise<MessageResponse>;
  finalizar(id: number): Promise<MessageResponse>;
  cancelar(id: number): Promise<MessageResponse>;
  /**
   * `POST /vendas` não devolve o id. Grava um snapshot, registra e relista
   * para achar a venda nova do operador logado.
   */
  registrarEResolverId(usuario: UsuarioDTO): Promise<VendaDTO>;
  /** `GET /vendas/:id` é 501 — a busca é na listagem. */
  localizar(id: number): Promise<VendaDTO | null>;
}

export class VendaService implements InterfaceVendaService {
  constructor(private readonly repository: InterfaceVendaRepository) {}

  listar(status?: StatusVenda): Promise<VendaDTO[]> {
    return listarTolerante(() => this.repository.listar(status));
  }

  listarEmAndamento(): Promise<VendaDTO[]> {
    return this.listar("EM_ANDAMENTO").then((lista) =>
      lista.filter((venda) => venda.status === "EM_ANDAMENTO"),
    );
  }

  listarEmAvaliacao(): Promise<VendaDTO[]> {
    return this.listar("EM_AVALIACAO").then((lista) =>
      lista.filter((venda) => venda.status === "EM_AVALIACAO"),
    );
  }

  registrar(dados: VendaRegistroInput): Promise<MessageResponse> {
    return this.repository.registrar(dados);
  }

  finalizar(id: number): Promise<MessageResponse> {
    return this.repository.finalizar(id);
  }

  cancelar(id: number): Promise<MessageResponse> {
    return this.repository.cancelar(id);
  }

  async localizar(id: number): Promise<VendaDTO | null> {
    const lista = await this.listar();
    return lista.find((venda) => venda.id === id) ?? null;
  }

  async registrarEResolverId(usuario: UsuarioDTO): Promise<VendaDTO> {
    const snapshot = await this.listar();
    const idsAntes = new Set(
      snapshot.map((venda) => venda.id).filter((id): id is number => id != null),
    );

    const dados: VendaRegistroInput =
      usuario.perfil === "CAIXA"
        ? { idCaixa: usuario.id }
        : { idAtendente: usuario.id };

    await this.repository.registrar(dados);

    const depois = await this.listar();
    const novas = depois.filter((venda) => {
      if (venda.id == null || idsAntes.has(venda.id)) return false;
      if (venda.status !== "EM_ANDAMENTO") return false;
      return usuario.perfil === "CAIXA"
        ? venda.idCaixa === usuario.id
        : venda.idAtendente === usuario.id;
    });

    novas.sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
    );

    const encontrada = novas[0];
    if (!encontrada) {
      throw new Error(
        "Venda registrada, mas não foi possível identificar o número. Tente de novo.",
      );
    }
    return encontrada;
  }
}
