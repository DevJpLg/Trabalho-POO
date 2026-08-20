import type { Perfil } from "../types/api";

export const ALL_PERFIS: Perfil[] = ["GERENTE", "ATENDENTE", "FARMACEUTICO", "CAIXA"];

export type NavChild = {
  to: string;
  label: string;
  roles?: Perfil[];
};

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  roles: Perfil[];
  to?: string;
  end?: boolean;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  {
    id: "inicio",
    label: "Início",
    icon: "fa-house",
    to: "/",
    end: true,
    roles: ALL_PERFIS,
  },
  {
    id: "caixa",
    label: "Caixa",
    icon: "fa-cash-register",
    roles: ["CAIXA"],
    children: [
      { to: "/caixa/novo", label: "Novo Atendimento" },
      { to: "/caixa/historico", label: "Histórico de Atendimentos" },
    ],
  },
  {
    id: "atendimento",
    label: "Atendimento",
    icon: "fa-headset",
    roles: ["ATENDENTE"],
    children: [
      { to: "/atendimento/novo", label: "Novo Atendimento" },
      { to: "/atendimento/historico", label: "Histórico de Atendimentos" },
    ],
  },
  {
    id: "avaliacoes",
    label: "Avaliações",
    icon: "fa-clipboard-check",
    roles: ["FARMACEUTICO"],
    children: [
      { to: "/avaliacoes/pendentes", label: "Avaliações Pendentes" },
      { to: "/avaliacoes/historico", label: "Histórico de Avaliações" },
    ],
  },
  {
    id: "produtos",
    label: "Produtos",
    icon: "fa-pills",
    roles: ["FARMACEUTICO", "GERENTE"],
    children: [
      { to: "/produtos/entrada", label: "Entrada de Produtos", roles: ["GERENTE"] },
      { to: "/produtos", label: "Todos os Produtos" },
      { to: "/produtos/validades", label: "Controle de Validades", roles: ["FARMACEUTICO"] },
    ],
  },
  {
    id: "prescricoes",
    label: "Prescrições",
    icon: "fa-file-medical",
    roles: ["FARMACEUTICO"],
    children: [
      { to: "/prescricoes/pendentes", label: "Prescrições Pendentes" },
      { to: "/prescricoes/historico", label: "Histórico de Prescrições" },
    ],
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: "fa-users",
    roles: ["GERENTE"],
    children: [
      { to: "/usuarios/novo", label: "Novo Usuário" },
      { to: "/usuarios", label: "Todos os usuários" },
    ],
  },
];

export function perfilPode(perfil: Perfil | undefined, roles: Perfil[]): boolean {
  return Boolean(perfil && roles.includes(perfil));
}

export function filhosVisiveis(item: NavItem, perfil: Perfil | undefined): NavChild[] {
  return (item.children ?? []).filter((child) => perfilPode(perfil, child.roles ?? item.roles));
}

export const pageTitles: Record<string, string> = {
  "/": "Visão geral",
  "/caixa/novo": "Novo Atendimento",
  "/caixa/historico": "Histórico de Atendimentos",
  "/atendimento/novo": "Novo Atendimento",
  "/atendimento/historico": "Histórico de Atendimentos",
  "/avaliacoes/pendentes": "Avaliações Pendentes",
  "/avaliacoes/historico": "Histórico de Avaliações",
  "/produtos": "Todos os Produtos",
  "/produtos/entrada": "Entrada de Produtos",
  "/produtos/validades": "Controle de Validades",
  "/prescricoes/pendentes": "Prescrições Pendentes",
  "/prescricoes/historico": "Histórico de Prescrições",
  "/usuarios": "Usuários",
  "/usuarios/novo": "Novo Usuário",
  "/vendas": "Vendas",
};
