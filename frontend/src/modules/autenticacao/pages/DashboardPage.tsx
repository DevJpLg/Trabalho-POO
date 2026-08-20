import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import type { Perfil, ProdutoDTO, VendaDTO } from "../../../shared/types/api";
import { Card, SectionTitle } from "../../../shared/ui/Card";
import { AreaChart, BarChart, DonutChart } from "../../../shared/ui/charts";
import { IconCart, IconClipboard, IconPills, IconShield, IconTrend } from "../../../shared/ui/icons";
import { StatCard } from "../../../shared/ui/StatCard";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { VendaRepository } from "../../venda/venda.repository";
import { VendaService } from "../../venda/venda.service";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const atalhosPorPerfil: Record<Perfil, { to: string; label: string }[]> = {
  GERENTE: [
    { to: "/produtos", label: "Todos os Produtos" },
    { to: "/produtos/entrada", label: "Entrada de Produtos" },
    { to: "/usuarios", label: "Usuários" },
  ],
  ATENDENTE: [
    { to: "/atendimento/novo", label: "Novo Atendimento" },
    { to: "/atendimento/historico", label: "Histórico de Atendimentos" },
  ],
  CAIXA: [
    { to: "/caixa/novo", label: "Novo Atendimento" },
    { to: "/caixa/historico", label: "Histórico de Atendimentos" },
  ],
  FARMACEUTICO: [
    { to: "/avaliacoes/pendentes", label: "Avaliações Pendentes" },
    { to: "/produtos", label: "Produtos" },
    { to: "/prescricoes/pendentes", label: "Prescrições Pendentes" },
  ],
};

export function DashboardPage() {
  usePageTitle("Visão geral");
  const { http, usuario } = useAuth();
  const produtos = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);
  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);

  const [items, setItems] = useState<ProdutoDTO[]>([]);
  const [vendas, setVendas] = useState<VendaDTO[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([produtos.listar(""), vendasApi.listar()]).then(([p, v]) => {
      if (!alive) return;
      if (p.status === "fulfilled") setItems(p.value);
      if (v.status === "fulfilled") setVendas(v.value);
    });
    return () => {
      alive = false;
    };
  }, [produtos, vendasApi]);

  const ativos = items.filter((p) => p.isActive);
  const bloqueados = items.filter((p) => !p.isActive);
  const vendasAbertas = vendas.filter((v) => v.status === "EM_ANDAMENTO");
  const vendasAvaliacao = vendas.filter((v) => v.status === "EM_AVALIACAO");
  const valorEstoque = items.reduce((sum, p) => sum + Number(p.preco) * p.quantidadeEstoque, 0);

  const topEstoque = [...items]
    .sort((a, b) => b.quantidadeEstoque - a.quantidadeEstoque)
    .slice(0, 7)
    .map((p) => ({
      label: p.nome.split(" ")[0] ?? p.nome,
      value: p.quantidadeEstoque,
    }));

  const classes = {
    LIVRE: items.filter((p) => p.classificacao === "LIVRE").length,
    PRESCRITO: items.filter((p) => p.classificacao === "PRESCRITO").length,
    CONTROLADO: items.filter((p) => p.classificacao === "CONTROLADO").length,
  };

  const recent = [...items]
    .sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque)
    .slice(0, 4);

  const areaPoints =
    items.length > 0
      ? items.slice(0, 8).map((p) => Number(p.preco) || 0)
      : [12, 28, 22, 40, 32, 48, 30, 42];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Produtos ativos"
          value={ativos.length}
          icon={<IconPills />}
          tone="green"
          to="/produtos"
        />
        <StatCard
          label="Produtos bloqueados"
          value={bloqueados.length}
          icon={<IconShield />}
          tone="rose"
          to="/produtos?ativo=false"
        />
        <StatCard
          label="Vendas em aberto"
          value={vendasAbertas.length}
          icon={<IconCart />}
          tone="mint"
          to="/vendas?status=EM_ANDAMENTO"
        />
        <StatCard
          label="Vendas em avaliação"
          value={vendasAvaliacao.length}
          icon={<IconClipboard />}
          tone="red"
          to="/vendas?status=EM_AVALIACAO"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div>
          <SectionTitle>Painel de estoque</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="relative overflow-hidden rounded-[25px] bg-brand-red p-6 text-white shadow-[0_16px_40px_rgba(227,28,36,0.28)]">
              <p className="text-sm/6 text-white/80">Valor em estoque</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{money(valorEstoque)}</p>
              <div className="mt-10 flex justify-between text-xs uppercase tracking-wider text-white/70">
                <span>Farmácia</span>
                <span>Bairro & Saúde</span>
              </div>
            </article>
            <article className="rounded-[25px] bg-white p-6 shadow-[0_8px_30px_rgba(26,46,37,0.04)]">
              <p className="text-sm text-ink-muted">Itens cadastrados</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{items.length}</p>
              <p className="mt-10 text-sm font-medium text-brand-green">
                {ativos.length} disponíveis para operação
              </p>
            </article>
          </div>
        </div>

        <Card>
          <SectionTitle>Estoque crítico</SectionTitle>
          <ul className="space-y-4">
            {recent.length === 0 ? (
              <li className="text-sm text-ink-muted">Nenhum produto carregado.</li>
            ) : (
              recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-11 items-center justify-center rounded-full ${
                        p.quantidadeEstoque <= 5
                          ? "bg-brand-red-soft text-brand-red"
                          : "bg-brand-green-soft text-brand-green"
                      }`}
                    >
                      <IconPills size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.nome}</p>
                      <p className="text-xs text-ink-muted">{p.codigoBarras}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      p.quantidadeEstoque <= 5 ? "text-brand-red" : "text-brand-green"
                    }`}
                  >
                    {p.quantidadeEstoque} un.
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle className="mb-0">Estoque por produto</SectionTitle>
            <span className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="size-2 rounded-full bg-brand-green" /> Qtd.
            </span>
          </div>
          <BarChart
            bars={
              topEstoque.length
                ? topEstoque
                : ["Sáb", "Dom", "Seg", "Ter", "Qua", "Qui", "Sex"].map((label) => ({
                    label,
                    value: 0,
                  }))
            }
          />
        </Card>

        <Card>
          <SectionTitle>Classificação</SectionTitle>
          <DonutChart
            slices={[
              { label: "Livre", value: classes.LIVRE || 1, color: "#16a34a" },
              { label: "Prescrito", value: classes.PRESCRITO, color: "#86efac" },
              { label: "Controlado", value: classes.CONTROLADO, color: "#e31c24" },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle>Acesso rápido</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {(usuario ? atalhosPorPerfil[usuario.perfil] : []).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full bg-canvas px-5 py-3 text-sm font-semibold text-ink transition hover:bg-brand-green hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <IconTrend className="text-brand-green" />
            <SectionTitle className="mb-0">Preços em evidência</SectionTitle>
          </div>
          <AreaChart points={areaPoints} />
        </Card>
      </div>
    </div>
  );
}
