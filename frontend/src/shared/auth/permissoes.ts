import type { Perfil, StatusVenda } from "../types/api";

/**
 * Espelho das regras de autorização que o backend aplica de fato.
 *
 * Cada constante abaixo foi lida direto do service correspondente, e não do
 * README — onde os dois divergem, vale o backend, porque é ele quem recusa a
 * requisição. Assim a UI só oferece ações que vão realmente passar.
 *
 * Referências:
 *  - `usuario/autorizacao/autorizacao.service.ts`
 *  - `produto/produto.service.ts`
 *  - `usuario/usuario.service.ts`
 *  - `itemVenda/itemVenda.service.ts` e `itemVenda/validacaoItem/validacaoItem.service.ts`
 */

/** `GET|POST|PUT|DELETE /api/usuarios` → cadastro/edição exige GERENTE; listagem também para quem opera vendas. */
export const PERFIS_GERENCIAM_USUARIOS: Perfil[] = ["GERENTE"];

/** CRUD de produto e `PATCH /api/produtos/:id/entrada` → exigem GERENTE. */
export const PERFIS_GERENCIAM_PRODUTOS: Perfil[] = ["GERENTE"];

/** `PATCH /api/produtos/:id/entrada` → exige GERENTE. */
export const PERFIS_DAO_ENTRADA_ESTOQUE: Perfil[] = ["GERENTE"];

/** `GET /api/produtos/validades`, `PATCH /:id/validade` e `PATCH /:id/bloquear|desbloquear` → FARMACEUTICO. */
export const PERFIS_CONTROLAM_VALIDADE: Perfil[] = ["FARMACEUTICO"];

/** `GET|POST|PATCH|DELETE /api/itens-venda/...` → exige ATENDENTE ou CAIXA. */
export const PERFIS_GERENCIAM_ITENS: Perfil[] = ["ATENDENTE", "CAIXA"];

/** `PATCH /api/itens-venda/.../aprovar|recusar` → exige FARMACEUTICO. */
export const PERFIS_AVALIAM_ITENS: Perfil[] = ["FARMACEUTICO"];

/** Tela de avaliações liberada para o farmacêutico, conforme exigência do front-end. */
export const PERFIS_FARMACEUTICO_PODEM_AVALIAR: Perfil[] = ["FARMACEUTICO"];

/** `GET|POST|PUT|DELETE /api/prescricoes` não tem checagem de perfil no backend. */
export const PERFIS_GERENCIAM_PRESCRICOES: Perfil[] = ["FARMACEUTICO", "ATENDENTE"];

/** `GET /api/produtos/busca` não tem checagem de perfil: todo autenticado consulta. */
export const PERFIS_CONSULTAM_PRODUTOS: Perfil[] = [
  "GERENTE",
  "ATENDENTE",
  "FARMACEUTICO",
  "CAIXA",
];

export const PERFIS_GERENCIAM_VENDAS: Perfil[] = ["ATENDENTE", "CAIXA", "FARMACEUTICO"];

export const PERFIS_REGISTRAR_VENDA_PDV: Perfil[] = ["ATENDENTE", "CAIXA"];

export const PERFIS_LISTAM_VENDAS: Perfil[] = PERFIS_GERENCIAM_VENDAS;



export function podeGerenciarUsuarios(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_GERENCIAM_USUARIOS);
}

export function podeGerenciarProdutos(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_GERENCIAM_PRODUTOS);
}

export function podeDarEntradaEstoque(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_DAO_ENTRADA_ESTOQUE);
}

export function podeControlarValidade(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_CONTROLAM_VALIDADE);
}

export function podeGerenciarItens(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_GERENCIAM_ITENS);
}

export function podeAvaliarItens(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_AVALIAM_ITENS);
}

export function podeGerenciarPrescricoes(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_GERENCIAM_PRESCRICOES);
}

export function podeGerenciarVendas(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_GERENCIAM_VENDAS);
}

export function podeRegistrarVendaPdv(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_REGISTRAR_VENDA_PDV);
}

/** Só o caixa confirma recebimento quando a venda está aguardando pagamento. */
export function podeReceberPagamentoVenda(perfil?: Perfil): boolean {
  return perfil === "CAIXA";
}

export function vendaAbertaNoPdv(status: StatusVenda): boolean {
  return status === "EM_ANDAMENTO";
}

/** Vendas que o operador pode retomar no painel PDV. */
export function vendaAbrivelNoPdv(perfil: Perfil | undefined, status: StatusVenda): boolean {
  if (status === "EM_ANDAMENTO") return podeRegistrarVendaPdv(perfil);
  if (status === "AGUARDANDO_PAGAMENTO") return podeReceberPagamentoVenda(perfil);
  return false;
}

export function podeListarVendas(perfil?: Perfil): boolean {
  return temPerfil(perfil, PERFIS_LISTAM_VENDAS);
}

export function usaCatalogoCompleto(perfil?: Perfil): boolean {
  return temPerfil(perfil, ["GERENTE", "FARMACEUTICO"]);
}

export function temPerfil(perfil: Perfil | undefined, permitidos: Perfil[]): boolean {
  return Boolean(perfil && permitidos.includes(perfil));
}
