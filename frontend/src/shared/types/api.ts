/**
 * Contratos da API (`/api`), espelhando o que os controllers do backend
 * realmente serializam hoje. Ver ERROS_BACKEND.md para as divergências conhecidas.
 */

export type MessageResponse = {
  message: string;
};

export type Perfil = "GERENTE" | "ATENDENTE" | "FARMACEUTICO" | "CAIXA";

export const PERFIS: readonly Perfil[] = ["GERENTE", "ATENDENTE", "FARMACEUTICO", "CAIXA"] as const;

export const perfilLabel: Record<Perfil, string> = {
  GERENTE: "Gerente",
  ATENDENTE: "Atendente",
  FARMACEUTICO: "Farmacêutico",
  CAIXA: "Caixa",
};

export type Classificacao = "LIVRE" | "CONTROLADO" | "PRESCRITO";

export const classificacaoLabel: Record<Classificacao, string> = {
  LIVRE: "Livre",
  CONTROLADO: "Controlado",
  PRESCRITO: "Prescrito",
};

/* ========== Usuário ========== */

export type UsuarioDTO = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

export type UsuarioInput = {
  nome: string;
  email: string;
  senha?: string;
  perfil: Perfil;
  numeroCRM?: string;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioDTO;
};

/* ========== Produto ========== */

export type ProdutoDTO = {
  id: number;
  nome: string;
  codigoBarras: string;
  descricao: string | null;
  principioAtivo: string;
  concentracao: string | null;
  formaFarmaceutica: string | null;
  fabricante: string;
  numeroRegAnvisa: string | null;
  tarja: string | null;
  categoria: string;
  classificacao: Classificacao;
  quantidadeEstoque: number;
  localEstoque: string | null;
  validade: string | null;
  classeControle: string | null;
  retencaoReceita: boolean;
  validadeReceita: number | null;
  generico: boolean;
  lote: string | null;
  preco: number;
  dataFabricacao: string | null;
  quantidadeMaxima: number | null;
  isActive: boolean;
};

export type ProdutoInput = {
  nome: string;
  codigoBarras: string;
  principioAtivo: string;
  fabricante: string;
  categoria: string;
  preco: number;
  descricao?: string | null;
  concentracao?: string | null;
  formaFarmaceutica?: string | null;
  numeroRegAnvisa?: string | null;
  tarja?: string | null;
  classificacao?: Classificacao;
  quantidadeEstoque?: number;
  localEstoque?: string | null;
  validade?: string | null;
  classeControle?: string | null;
  retencaoReceita?: boolean;
  validadeReceita?: number | null;
  generico?: boolean;
  lote?: string | null;
  dataFabricacao?: string | null;
  quantidadeMaxima?: number | null;
  isActive?: boolean;
};

/* ========== Venda ========== */

export type StatusVenda =
  | "EM_ANDAMENTO"
  | "EM_AVALIACAO"
  | "AGUARDANDO_PAGAMENTO"
  | "FINALIZADA"
  | "CANCELADA";

export const STATUS_VENDA: readonly StatusVenda[] = [
  "EM_ANDAMENTO",
  "EM_AVALIACAO",
  "AGUARDANDO_PAGAMENTO",
  "FINALIZADA",
  "CANCELADA",
] as const;

export const statusVendaLabel: Record<StatusVenda, string> = {
  EM_ANDAMENTO: "Em aberto",
  EM_AVALIACAO: "Em avaliação",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export type VendaDTO = {
  id: number | null;
  dataHora: string;
  status: StatusVenda;
  idAtendente: number | null;
  idFarmaceutico: number | null;
  idCaixa: number | null;
};

/* ========== Item de venda ========== */

export type ItemVendaDTO = {
  id: number;
  quantidade: number;
  precoUnitario: number;
  precoSubtotal: number;
  exigeAvaliacao: boolean;
  aprovadoFarmaceutico: boolean;
  vendaId: number;
  produtoId: number;
};

export type TotalVendaDTO = {
  vendaId: number;
  total: number;
};

/* ========== Prescrição ========== */

export type PrescricaoDTO = {
  id: number;
  numeroPrescricao: string;
  nomeMedico: string;
  numeroCrm: string;
  ufCrm: string;
  nomePaciente: string;
  retencao: boolean;
  dataEmissao: string;
  dataValidade: string;
  anexo: string;
  retida: boolean;
  vendaId: number;
};

export type PrescricaoInput = {
  numeroPrescricao: string;
  nomeMedico: string;
  numeroCrm: string;
  ufCrm: string;
  nomePaciente: string;
  retencao: boolean;
  dataEmissao: string;
  dataValidade: string;
  anexo?: string;
  retida: boolean;
  vendaId: number;
};

/* ========== Notificação ========== */

export type NotificacaoDTO = {
  id: number;
  vendaId: number;
  dataHora: string;
  farmaceuticoId: number | null;
};

export const UFS: readonly string[] = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
