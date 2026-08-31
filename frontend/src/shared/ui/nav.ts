import type { ComponentType, SVGProps } from "react";
import type { Perfil } from "../types/api";
import {
  IconCart,
  IconFileMedical,
  IconHome,
  IconPills,
  IconUsers,
} from "./icons";
import {
  PERFIS_CONTROLAM_VALIDADE,
  PERFIS_GERENCIAM_PRESCRICOES,
  PERFIS_GERENCIAM_PRODUTOS,
  PERFIS_GERENCIAM_USUARIOS,
  PERFIS_GERENCIAM_VENDAS,
  temPerfil,
} from "../auth/permissoes";

export const ALL_PERFIS: Perfil[] = ["GERENTE", "ATENDENTE", "FARMACEUTICO", "CAIXA"];

export type NavChild = {
  to: string;
  label: string;
  roles?: Perfil[];
};

/** Ícones são componentes locais: nada depende de CDN externo para o menu aparecer. */
export type IconeNav = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export type NavItem = {
  id: string;
  label: string;
  icon: IconeNav;
  roles: Perfil[];
  to?: string;
  end?: boolean;
  children?: NavChild[];
};

/**
 * Menu lateral por perfil. A ordem dos itens é a ordem na tela; `roles` define
 * quem vê cada entrada.
 */
export const navItems: NavItem[] = [
  {
    id: "inicio",
    label: "Início",
    icon: IconHome,
    to: "/",
    end: true,
    roles: ALL_PERFIS,
  },
  {
    id: "produtos",
    label: "Produtos",
    icon: IconPills,
    roles: ["GERENTE", "FARMACEUTICO"],
    children: [
      { to: "/produtos", label: "Todos os Produtos", roles: PERFIS_GERENCIAM_PRODUTOS },
      { to: "/produtos", label: "Consultar Produtos", roles: ["FARMACEUTICO"] },
      { to: "/produtos/validades", label: "Controle de Validades", roles: PERFIS_CONTROLAM_VALIDADE },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    icon: IconCart,
    to: "/vendas",
    roles: PERFIS_GERENCIAM_VENDAS,
  },
  {
    id: "prescricoes",
    label: "Prescrições",
    icon: IconFileMedical,
    to: "/prescricoes",
    roles: PERFIS_GERENCIAM_PRESCRICOES,
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: IconUsers,
    to: "/usuarios",
    roles: PERFIS_GERENCIAM_USUARIOS,
  },
];

export function perfilPode(perfil: Perfil | undefined, roles: Perfil[]): boolean {
  return temPerfil(perfil, roles);
}

export function filhosVisiveis(item: NavItem, perfil: Perfil | undefined): NavChild[] {
  return (item.children ?? []).filter((child) => perfilPode(perfil, child.roles ?? item.roles));
}

export const pageTitles: Record<string, string> = {
  "/": "Visão geral",
  "/atendimento": "Atendimento",
  "/caixa": "Caixa",
  "/avaliacoes": "Avaliações",
  "/produtos": "Produtos",
  "/produtos/validades": "Controle de Validades",
  "/prescricoes": "Prescrições",
  "/vendas": "Vendas",
  "/usuarios": "Usuários",
};
