export type MessageResponse = {
  message: string;
};

export type Perfil = "GERENTE" | "ATENDENTE" | "FARMACEUTICO" | "CAIXA";

export type Classificacao = "LIVRE" | "CONTROLADO" | "PRESCRITO";

export type UsuarioDTO = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioDTO;
};

export type UsuarioInput = {
  nome: string;
  email: string;
  senha?: string;
  perfil: Perfil;
  numeroCRM?: string;
};

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

export type StatusVenda =
  | "EM_ANDAMENTO"
  | "EM_AVALIACAO"
  | "AGUARDANDO_PAGAMENTO"
  | "FINALIZADA"
  | "CANCELADA";

export type VendaDTO = {
  id: number | null;
  dataHora: string;
  status: StatusVenda;
  idAtendente: number | null;
  idFarmaceutico: number | null;
  idCaixa: number | null;
};

export type PrescricaoDTO = {
  id?: number;
  numeroPrescricao?: string;
  nomeMedico?: string;
  numeroCrm?: string;
  ufCrm?: string;
  nomePaciente?: string;
  retencao?: boolean;
  dataEmissao?: string;
  dataValidade?: string;
  anexo?: string;
  retida?: boolean;
  vendaId?: number;
  // getters may serialize oddly — keep index signature tolerant
  [key: string]: unknown;
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
