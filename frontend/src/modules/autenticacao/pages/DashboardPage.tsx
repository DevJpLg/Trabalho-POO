import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { podeControlarValidade, usaCatalogoCompleto } from "../../../shared/auth/permissoes";
import { classificacaoLabel, type Perfil, type ProdutoDTO, type VendaDTO } from "../../../shared/types/api";
import { Card, CardHeader, SectionTitle } from "../../../shared/ui/Card";
import { AreaChart, BarChart, DonutChart } from "../../../shared/ui/charts";
import { data as formatarData, diasAte, moeda } from "../../../shared/ui/format";
import { Skeleton } from "../../../shared/ui/PageHeader";
import {
  IconAlert,
  IconArrowRight,
  IconCart,
  IconClipboard,
  IconClipboardCheck,
  IconFileMedical,
  IconPills,
  IconShield,
  IconTrend,
  IconUsers,
} from "../../../shared/ui/icons";
import type { IconeNav } from "../../../shared/ui/nav";
import { StatCard } from "../../../shared/ui/StatCard";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { VendaRepository } from "../../venda/venda.repository";
import { VendaService } from "../../venda/venda.service";

const atalhosPorPerfil: Record<Perfil, { to: string; label: string; icone: IconeNav }[]> = {
  GERENTE: [
    { to: "/produtos", label: "Produtos", icone: IconPills },
    { to: "/usuarios", label: "Usuários", icone: IconUsers },
  ],
  ATENDENTE: [
    { to: "/vendas", label: "Vendas", icone: IconCart },
    { to: "/prescricoes", label: "Prescrições", icone: IconFileMedical },
  ],
  CAIXA: [{ to: "/vendas", label: "Vendas", icone: IconCart }],
  FARMACEUTICO: [
    { to: "/produtos", label: "Produtos", icone: IconPills },
    { to: "/avaliacoes", label: "Avaliações", icone: IconClipboardCheck },
    { to: "/prescricoes", label: "Prescrições", icone: IconFileMedical },
  ],
};

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

export function DashboardPage() {
  usePageTitle("Visão geral");
  const { http, usuario } = useAuth();
  const perfil = usuario?.perfil;
  const catalogoCompleto = usaCatalogoCompleto(perfil);
  const acompanhaValidade = podeControlarValidade(perfil);

  const produtos = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);
  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);

  const [items, setItems] = useState<ProdutoDTO[]>([]);
  const [vendas, setVendas] = useState<VendaDTO[]>([]);
  const [vencendo, setVencendo] = useState<ProdutoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    Promise.allSettled([
      produtos.listarPorPerfil(catalogoCompleto, ""),
      vendasApi.listar(),
      acompanhaValidade ? produtos.listarValidades() : Promise.resolve<ProdutoDTO[]>([]),
    ]).then(([resProdutos, resVendas, resValidades]) => {
      if (!ativo) return;
      if (resProdutos.status === "fulfilled") setItems(resProdutos.value);
      if (resVendas.status === "fulfilled") setVendas(resVendas.value);
      if (resValidades.status === "fulfilled") setVencendo(resValidades.value);
      setCarregando(false);
    });

    return () => {
      ativo = false;
    };
  }, [produtos, vendasApi, catalogoCompleto, acompanhaValidade]);

  const ativos = items.filter((produto) => produto.isActive);
  const bloqueados = items.filter((produto) => !produto.isActive);
  const porStatus = (status: VendaDTO["status"]) =>
    vendas.filter((venda) => venda.status === status);
  const valorEstoque = items.reduce(
    (soma, produto) => soma + Number(produto.preco) * produto.quantidadeEstoque,
    0,
  );

  const topEstoque = [...items]
    .sort((a, b) => b.quantidadeEstoque - a.quantidadeEstoque)
    .slice(0, 7)
    .map((produto) => ({
      label: produto.nome.split(" ")[0] ?? produto.nome,
      value: produto.quantidadeEstoque,
    }));

  const classes = (["LIVRE", "PRESCRITO", "CONTROLADO"] as const).map((classificacao) => ({
    label: classificacaoLabel[classificacao],
    value: items.filter((produto) => produto.classificacao === classificacao).length,
  }));

  const estoqueCritico = [...items]
    .sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque)
    .slice(0, 4);

  const maisCaros = [...items]
    .filter((produto) => produto.isActive)
    .sort((a, b) => Number(b.preco) - Number(a.preco))
    .slice(0, 6);

  const pontosPreco =
    maisCaros.length > 0 ? maisCaros.map((produto) => Number(produto.preco) || 0) : [12, 28, 22, 40, 32, 48];
  const rotulosPreco = maisCaros.map((produto) => {
    const partes = produto.nome.trim().split(/\s+/);
    return partes.slice(0, 2).join(" ") || produto.nome;
  });

  if (carregando) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <Skeleton key={indice} className="h-[84px] rounded-[25px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Skeleton className="h-[168px] rounded-[25px]" />
          <Skeleton className="h-[168px] rounded-[25px]" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Skeleton className="h-[300px] rounded-[25px]" />
          <Skeleton className="h-[300px] rounded-[25px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {usuario ? (
        <div className="animate-surgir">
          <p className="text-sm text-ink-muted">
            {saudacao()}, <strong className="font-semibold text-ink">{usuario.nome.split(" ")[0]}</strong> —
            aqui está o resumo de hoje.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[25px] bg-surface p-4 shadow-card ring-1 ring-line/60 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Acesso rápido</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(perfil ? atalhosPorPerfil[perfil] : []).map((atalho) => (
              <Link
                key={atalho.to}
                to={atalho.to}
                className="group inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2 text-xs font-semibold text-ink transition-all duration-150 hover:bg-brand-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
              >
                <atalho.icone size={14} className="shrink-0 text-ink-muted transition-colors group-hover:text-white" />
                <span>{atalho.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <StatCard
          label={catalogoCompleto ? "Produtos ativos" : "Produtos disponíveis"}
          value={ativos.length}
          apoio={catalogoCompleto ? `de ${items.length} cadastrados` : "no catálogo vendável"}
          icon={<IconPills />}
          tone="green"
          to="/produtos"
        />

        {acompanhaValidade ? (
          <StatCard
            label="Vencendo em 30 dias"
            value={vencendo.length}
            apoio={vencendo.length > 0 ? "precisa de atenção" : "nada urgente"}
            icon={<IconAlert />}
            tone="rose"
            to="/produtos/validades"
          />
        ) : (
          <StatCard
            label="Produtos bloqueados"
            value={bloqueados.length}
            apoio={bloqueados.length > 0 ? "fora de circulação" : "nenhum bloqueio"}
            icon={<IconShield />}
            tone="rose"
            to="/produtos"
          />
        )}

        <StatCard
          label={perfil === "CAIXA" ? "Aguardando pagamento" : "Vendas em aberto"}
          value={
            perfil === "CAIXA"
              ? porStatus("AGUARDANDO_PAGAMENTO").length
              : porStatus("EM_ANDAMENTO").length
          }
          apoio={`${vendas.length} vendas no total`}
          icon={<IconCart />}
          tone="mint"
          to={
            perfil === "CAIXA"
              ? "/vendas?status=AGUARDANDO_PAGAMENTO"
              : "/vendas?status=EM_ANDAMENTO"
          }
        />

        <StatCard
          label="Vendas em avaliação"
          value={porStatus("EM_AVALIACAO").length}
          apoio="controlados e prescritos"
          icon={<IconClipboard />}
          tone="red"
          to={acompanhaValidade ? "/avaliacoes" : "/vendas?status=EM_AVALIACAO"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ display: "none" }}>
        <StatCard
          label={catalogoCompleto ? "Produtos ativos" : "Produtos disponíveis"}
          value={ativos.length}
          apoio={catalogoCompleto ? `de ${items.length} cadastrados` : "no catálogo vendável"}
          icon={<IconPills />}
          tone="green"
          to="/produtos"
        />

        {acompanhaValidade ? (
          <StatCard
            label="Vencendo em 30 dias"
            value={vencendo.length}
            apoio={vencendo.length > 0 ? "precisa de atenção" : "nada urgente"}
            icon={<IconAlert />}
            tone="rose"
            to="/produtos/validades"
          />
        ) : (
          <StatCard
            label="Produtos bloqueados"
            value={bloqueados.length}
            apoio={bloqueados.length > 0 ? "fora de circulação" : "nenhum bloqueio"}
            icon={<IconShield />}
            tone="rose"
            to="/produtos"
          />
        )}

        <StatCard
          label={perfil === "CAIXA" ? "Aguardando pagamento" : "Vendas em aberto"}
          value={
            perfil === "CAIXA"
              ? porStatus("AGUARDANDO_PAGAMENTO").length
              : porStatus("EM_ANDAMENTO").length
          }
          apoio={`${vendas.length} vendas no total`}
          icon={<IconCart />}
          tone="mint"
          to={
            perfil === "CAIXA"
              ? "/vendas?status=AGUARDANDO_PAGAMENTO"
              : "/vendas?status=EM_ANDAMENTO"
          }
        />

        <StatCard
          label="Vendas em avaliação"
          value={porStatus("EM_AVALIACAO").length}
          apoio="controlados e prescritos"
          icon={<IconClipboard />}
          tone="red"
          to={acompanhaValidade ? "/avaliacoes" : "/vendas?status=EM_AVALIACAO"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionTitle>Painel de estoque</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-1">
            <article className="rounded-[25px] bg-surface p-6 shadow-card ring-1 ring-line/60">
              <p className="text-sm text-ink-muted">
                {catalogoCompleto ? "Itens cadastrados" : "Itens no catálogo"}
              </p>
              <p className="mt-4 text-[30px] font-bold leading-none tracking-tight text-ink">
                {items.length}
              </p>
              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-green transition-all duration-700"
                  style={{
                    width: `${items.length ? (ativos.length / items.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-brand-green">
                {ativos.length} disponíveis para operação
              </p>
            </article>
          </div>
        </div>

        <Card>
          <CardHeader titulo="Estoque crítico" descricao="Os quatro itens com menos unidades." />
          <ul className="space-y-3">
            {estoqueCritico.length === 0 ? (
              <li className="text-sm text-ink-muted">Nenhum produto carregado.</li>
            ) : (
              estoqueCritico.map((produto) => (
                <li
                  key={produto.id}
                  className="flex items-center justify-between gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        produto.quantidadeEstoque <= 5
                          ? "bg-brand-red-soft text-brand-red"
                          : "bg-brand-green-soft text-brand-green"
                      }`}
                    >
                      <IconPills size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{produto.nome}</p>
                      <p className="truncate text-xs text-ink-muted">
                        vence {formatarData(produto.validade)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      produto.quantidadeEstoque <= 5 ? "text-brand-red" : "text-brand-green"
                    }`}
                  >
                    {produto.quantidadeEstoque} un.
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Estoque por produto"
            descricao="Os sete itens com maior quantidade."
            acao={
              <span className="flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-muted">
                <span className="size-2 rounded-full bg-brand-green" /> unidades
              </span>
            }
          />
          <BarChart
            bars={
              topEstoque.length
                ? topEstoque
                : ["—", "—", "—", "—", "—", "—", "—"].map((label) => ({ label, value: 0 }))
            }
          />
        </Card>

        <Card>
          <CardHeader titulo="Classificação" descricao="Distribuição do catálogo por tarja." />
          <DonutChart slices={classes} total="produtos" />
        </Card>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-1">
        <Card>
          <CardHeader
            titulo="Preços em evidência"
            descricao="Os itens mais caros do catálogo."
            acao={
              <span className="rounded-full bg-brand-red-soft px-3 py-1.5 text-[11px] font-semibold text-brand-red">
                Top {maisCaros.length || 0}
              </span>
            }
          />
          <div className="space-y-4">
            <AreaChart points={pontosPreco} labels={rotulosPreco} formatar={moeda} />

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {maisCaros.length > 0 ? (
                maisCaros.map((produto, indice) => (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-[11px] font-bold text-brand-red">
                        {indice + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{produto.nome}</p>
                        <p className="text-[11px] text-ink-muted">{produto.categoria}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-brand-red">
                      {moeda(Number(produto.preco))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-muted">Nenhum produto cadastrado para mostrar preços.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {acompanhaValidade && vencendo.length > 0 ? (
        <Card>
          <CardHeader
            titulo="Vencendo em breve"
            descricao="Produtos que saem de validade nos próximos 30 dias."
            acao={
              <Link
                to="/produtos/validades"
                className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-ink transition hover:bg-brand-green hover:text-white"
              >
                Ver todos
              </Link>
            }
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {vencendo.slice(0, 4).map((produto) => {
              const dias = diasAte(produto.validade);
              return (
                <li
                  key={produto.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{produto.nome}</p>
                    <p className="text-xs text-ink-muted">{formatarData(produto.validade)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      dias !== null && dias < 0
                        ? "bg-brand-red-soft text-brand-red"
                        : "bg-amber-soft text-amber-ink"
                    }`}
                  >
                    {dias !== null && dias < 0 ? "vencido" : `${dias} dias`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
