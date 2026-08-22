import type { Perfil } from "../types/api";

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

/** `GET|POST|PUT|DELETE /api/usuarios` → `usuarioService` exige GERENTE. */
export const PERFIS_GERENCIAM_USUARIOS: Perfil[] = ["GERENTE"];

/** `GET /api/produtos` e o CRUD de produto → `produtoService` exige GERENTE. */
export const PERFIS_GERENCIAM_PRODUTOS: Perfil[] = ["GERENTE"];

/** `PATCH /api/produtos/:id/entrada` → exige GERENTE. */
export const PERFIS_DAO_ENTRADA_ESTOQUE: Perfil[] = ["GERENTE"];

/** `GET /api/produtos/validades` e `PATCH /api/produtos/:id/bloquear` → exigem FARMACEUTICO. */
export const PERFIS_CONTROLAM_VALIDADE: Perfil[] = ["FARMACEUTICO"];

/** `GET|POST|PATCH|DELETE /api/itens-venda/...` → exige ATENDENTE ou CAIXA. */
export const PERFIS_GERENCIAM_ITENS: Perfil[] = ["ATENDENTE", "CAIXA"];

/** `PATCH /api/itens-venda/.../aprovar|recusar` → exige FARMACEUTICO. */
export const PERFIS_AVALIAM_ITENS: Perfil[] = ["FARMACEUTICO"];

/** `GET|POST|PUT|DELETE /api/prescricoes` não tem checagem de perfil no backend. */
export const PERFIS_GERENCIAM_PRESCRICOES: Perfil[] = ["FARMACEUTICO"];

/** `GET /api/produtos/busca` não tem checagem de perfil: todo autenticado consulta. */
export const PERFIS_CONSULTAM_PRODUTOS: Perfil[] = [
  "GERENTE",
  "ATENDENTE",
  "FARMACEUTICO",
  "CAIXA",
];

/** `GET /api/vendas` não tem checagem de perfil: todo autenticado lista. */
export const PERFIS_VEEM_VENDAS: Perfil[] = ["GERENTE", "ATENDENTE", "FARMACEUTICO", "CAIXA"];

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

/**
 * O GERENTE lista tudo por `GET /api/produtos`; os demais perfis só enxergam o
 * catálogo vendável por `GET /api/produtos/busca` (com estoque, na validade e ativo).
 */
export function usaCatalogoCompleto(perfil?: Perfil): boolean {
  return podeGerenciarProdutos(perfil);
}

export function temPerfil(perfil: Perfil | undefined, permitidos: Perfil[]): boolean {
  return Boolean(perfil && permitidos.includes(perfil));
}
