import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import {
  podeControlarValidade,
  podeGerenciarPrescricoes,
  podeGerenciarUsuarios,
  podeListarVendas,
  usaCatalogoCompleto,
} from "../../../shared/auth/permissoes";
import {
  PERFIS,
  STATUS_VENDA,
  classificacaoLabel,
  perfilLabel,
  statusVendaLabel,
  type Classificacao,
  type Perfil,
  type PrescricaoDTO,
  type ProdutoDTO,
  type StatusVenda,
  type UsuarioDTO,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Card, CardHeader } from "../../../shared/ui/Card";
import { AreaChart, BarChart, DonutChart } from "../../../shared/ui/charts";
import { data as formatarData, dataHora, diasAte, JANELA_VALIDADE_DIAS, moeda } from "../../../shared/ui/format";
import { Skeleton } from "../../../shared/ui/PageHeader";
import {
  IconAlert,
  IconCart,
  IconClipboard,
  IconFileMedical,
  IconPills,
  IconShield,
  IconUsers,
} from "../../../shared/ui/icons";
import type { IconeNav } from "../../../shared/ui/nav";
import { StatCard } from "../../../shared/ui/StatCard";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { PrescricaoRepository } from "../../prescricao/prescricao.repository";
import { PrescricaoService } from "../../prescricao/prescricao.service";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { UsuarioRepository } from "../../usuario/usuario.repository";
import { UsuarioService } from "../../usuario/usuario.service";
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
    { to: "/vendas", label: "Vendas", icone: IconCart },
    { to: "/prescricoes", label: "Prescrições", icone: IconFileMedical },
  ],
};

const coresStatus: Record<StatusVenda, string> = {
  EM_ANDAMENTO: "var(--color-brand-green)",
  EM_AVALIACAO: "var(--color-amber-ink)",
  AGUARDANDO_PAGAMENTO: "var(--color-chart-secondary)",
  FINALIZADA: "var(--color-ink-muted)",
  CANCELADA: "var(--color-brand-red)",
};

const coresPerfil: Record<Perfil, string> = {
  GERENTE: "var(--color-brand-red)",
  FARMACEUTICO: "var(--color-amber-ink)",
  ATENDENTE: "var(--color-brand-green)",
  CAIXA: "var(--color-ink-muted)",
};

const coresClassificacao: Record<Classificacao, string> = {
  LIVRE: "var(--color-brand-green)",
  PRESCRITO: "var(--color-amber-ink)",
  CONTROLADO: "var(--color-brand-red)",
};

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

function statusTone(status: StatusVenda) {
  if (status === "EM_AVALIACAO") return "amber" as const;
  if (status === "CANCELADA") return "red" as const;
  if (status === "FINALIZADA") return "neutral" as const;
  return "green" as const;
}

function tonePerfil(perfil: Perfil) {
  if (perfil === "GERENTE") return "red" as const;
  if (perfil === "FARMACEUTICO") return "amber" as const;
  if (perfil === "ATENDENTE") return "green" as const;
  return "neutral" as const;
}

function toneClassificacao(classificacao: Classificacao) {
  if (classificacao === "LIVRE") return "green" as const;
  if (classificacao === "CONTROLADO") return "red" as const;
  return "amber" as const;
}

function nomeCurto(nome: string, palavras = 2) {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, palavras).join(" ") || nome;
}

function porStatus(vendas: VendaDTO[], status: StatusVenda) {
  return vendas.filter((venda) => venda.status === status);
}

function ordenarVendas(vendas: VendaDTO[], maisRecente = true) {
  return [...vendas].sort((a, b) => {
    const delta = new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
    return maisRecente ? -delta : delta;
  });
}

function fatiasStatus(vendas: VendaDTO[]) {
  return STATUS_VENDA.map((status) => ({
    label: statusVendaLabel[status],
    value: porStatus(vendas, status).length,
    color: coresStatus[status],
  }));
}

function fatiasClassificacao(produtos: ProdutoDTO[]) {
  return (["LIVRE", "PRESCRITO", "CONTROLADO"] as const).map((classificacao) => ({
    label: classificacaoLabel[classificacao],
    value: produtos.filter((produto) => produto.classificacao === classificacao).length,
    color: coresClassificacao[classificacao],
  }));
}

function rotuloValidade(dias: number | null) {
  if (dias === null) return "sem data";
  if (dias < 0) return "vencido";
  if (dias === 0) return "vence hoje";
  return `${dias} dias`;
}

function toneValidade(dias: number | null) {
  if (dias === null) return "neutral" as const;
  if (dias < 0) return "red" as const;
  if (dias <= JANELA_VALIDADE_DIAS) return "amber" as const;
  return "green" as const;
}

function LinkVerTodos({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-ink transition hover:bg-brand-green hover:text-white"
    >
      {children}
    </Link>
  );
}

type ColunaMini<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  fim?: boolean;
};

function MiniTable<T>({
  columns,
  rows,
  rowKey,
  vazio,
}: {
  columns: ColunaMini<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  vazio: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">{vazio}</p>;
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-muted">
            {columns.map((coluna) => (
              <th
                key={coluna.key}
                className={`whitespace-nowrap py-2 font-semibold ${coluna.fim ? "text-right" : ""}`}
              >
                {coluna.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line/50 last:border-0">
              {columns.map((coluna) => (
                <td
                  key={coluna.key}
                  className={`py-2.5 align-middle ${coluna.fim ? "text-right" : "pr-3"}`}
                >
                  {coluna.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPage() {
  usePageTitle("Visão geral");
  const { http, usuario } = useAuth();
  const perfil = usuario?.perfil;
  const catalogoCompleto = usaCatalogoCompleto(perfil);
  const acompanhaValidade = podeControlarValidade(perfil);
  const carregaVendas = podeListarVendas(perfil);
  const carregaPrescricoes = podeGerenciarPrescricoes(perfil);
  const carregaUsuarios = podeGerenciarUsuarios(perfil);

  const produtos = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);
  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const prescricoesApi = useMemo(
    () => new PrescricaoService(new PrescricaoRepository(http)),
    [http],
  );
  const usuariosApi = useMemo(() => new UsuarioService(new UsuarioRepository(http)), [http]);

  const [items, setItems] = useState<ProdutoDTO[]>([]);
  const [vendas, setVendas] = useState<VendaDTO[]>([]);
  const [vencendo, setVencendo] = useState<ProdutoDTO[]>([]);
  const [prescricoes, setPrescricoes] = useState<PrescricaoDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    Promise.allSettled([
      produtos.listarPorPerfil(catalogoCompleto, ""),
      carregaVendas ? vendasApi.listar() : Promise.resolve<VendaDTO[]>([]),
      acompanhaValidade ? produtos.listarValidades(JANELA_VALIDADE_DIAS) : Promise.resolve<ProdutoDTO[]>([]),
      carregaPrescricoes ? prescricoesApi.listar() : Promise.resolve<PrescricaoDTO[]>([]),
      carregaUsuarios ? usuariosApi.listar() : Promise.resolve<UsuarioDTO[]>([]),
    ]).then(([resProdutos, resVendas, resValidades, resPrescricoes, resUsuarios]) => {
      if (!ativo) return;
      if (resProdutos.status === "fulfilled") setItems(resProdutos.value);
      if (resVendas.status === "fulfilled") setVendas(resVendas.value);
      if (resValidades.status === "fulfilled") setVencendo(resValidades.value);
      if (resPrescricoes.status === "fulfilled") setPrescricoes(resPrescricoes.value);
      if (resUsuarios.status === "fulfilled") setUsuarios(resUsuarios.value);
      setCarregando(false);
    });

    return () => {
      ativo = false;
    };
  }, [
    produtos,
    vendasApi,
    prescricoesApi,
    usuariosApi,
    catalogoCompleto,
    acompanhaValidade,
    carregaVendas,
    carregaPrescricoes,
    carregaUsuarios,
  ]);

  const ativos = items.filter((produto) => produto.isActive);
  const bloqueados = items.filter((produto) => !produto.isActive);

  if (carregando) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, indice) => (
            <Skeleton key={indice} className="h-[84px] rounded-[25px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Skeleton className="h-[280px] rounded-[25px]" />
          <Skeleton className="h-[280px] rounded-[25px]" />
        </div>
        <Skeleton className="h-[240px] rounded-[25px]" />
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
            label="Vencendo em 15 dias"
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
              ? porStatus(vendas, "AGUARDANDO_PAGAMENTO").length
              : porStatus(vendas, "EM_ANDAMENTO").length
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
          value={porStatus(vendas, "EM_AVALIACAO").length}
          apoio="controlados e prescritos"
          icon={<IconClipboard />}
          tone="red"
          to={acompanhaValidade ? "/avaliacoes" : "/vendas?status=EM_AVALIACAO"}
        />
      </div>

      {perfil === "ATENDENTE" ? (
        <PainelAtendente vendas={vendas} produtos={items} prescricoes={prescricoes} />
      ) : null}
      {perfil === "CAIXA" ? <PainelCaixa vendas={vendas} produtos={items} /> : null}
      {perfil === "FARMACEUTICO" ? (
        <PainelFarmaceutico
          vendas={vendas}
          produtos={items}
          vencendo={vencendo}
          prescricoes={prescricoes}
        />
      ) : null}
      {perfil === "GERENTE" ? <PainelGerente produtos={items} usuarios={usuarios} /> : null}
    </div>
  );
}

function PainelAtendente({
  vendas,
  produtos,
  prescricoes,
}: {
  vendas: VendaDTO[];
  produtos: ProdutoDTO[];
  prescricoes: PrescricaoDTO[];
}) {
  const fatiasVenda = fatiasStatus(vendas);
  const fatiasTarja = fatiasClassificacao(produtos);
  const fila = ordenarVendas(
    vendas.filter((venda) => venda.status === "EM_ANDAMENTO" || venda.status === "EM_AVALIACAO"),
  ).slice(0, 8);
  const recentesPrescricoes = [...prescricoes]
    .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime())
    .slice(0, 8);
  const prescritos = produtos.filter(
    (produto) => produto.classificacao === "PRESCRITO" || produto.classificacao === "CONTROLADO",
  ).length;

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Vendas por status"
            descricao="Fila do atendimento: abertas, em avaliação e as demais."
            acao={<LinkVerTodos to="/vendas">Ver vendas</LinkVerTodos>}
          />
          {fatiasVenda.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasVenda} total="vendas" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma venda registrada ainda.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            titulo="Tarja no catálogo"
            descricao="Só o atendente inclui prescritos e controlados na venda."
          />
          {fatiasTarja.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasTarja} total="itens" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto disponível no catálogo.</p>
          )}
          <p className="mt-4 text-sm text-ink-muted">
            <strong className="font-semibold text-ink">{prescritos}</strong> itens exigem receita.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Vendas em andamento"
            descricao="Abertas no balcão ou aguardando o farmacêutico."
            acao={<LinkVerTodos to="/vendas?status=EM_ANDAMENTO">Ver todas</LinkVerTodos>}
          />
          <MiniTable
            rows={fila}
            rowKey={(venda) => venda.id ?? venda.dataHora}
            vazio="Nenhuma venda aberta ou em avaliação."
            columns={[
              {
                key: "id",
                header: "Venda",
                render: (venda) =>
                  venda.id != null && venda.status === "EM_ANDAMENTO" ? (
                    <Link
                      to={`/registrar-venda?venda=${venda.id}`}
                      className="font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-2"
                    >
                      #{venda.id}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">#{venda.id ?? "—"}</span>
                  ),
              },
              {
                key: "data",
                header: "Quando",
                render: (venda) => (
                  <span className="text-ink-muted">{dataHora(venda.dataHora)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                fim: true,
                render: (venda) => (
                  <Badge dot tone={statusTone(venda.status)}>
                    {statusVendaLabel[venda.status]}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader
            titulo="Prescrições"
            descricao="Receitas vinculadas às vendas do atendimento."
            acao={<LinkVerTodos to="/prescricoes">Ver todas</LinkVerTodos>}
          />
          <MiniTable
            rows={recentesPrescricoes}
            rowKey={(prescricao) => prescricao.id}
            vazio="Nenhuma prescrição cadastrada."
            columns={[
              {
                key: "paciente",
                header: "Paciente",
                render: (prescricao) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{prescricao.nomePaciente}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {prescricao.numeroPrescricao} · venda #{prescricao.vendaId}
                    </p>
                  </div>
                ),
              },
              {
                key: "validade",
                header: "Validade",
                fim: true,
                render: (prescricao) => {
                  const dias = diasAte(prescricao.dataValidade);
                  return (
                    <Badge tone={toneValidade(dias)}>
                      {rotuloValidade(dias)}
                    </Badge>
                  );
                },
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}

function PainelCaixa({ vendas, produtos }: { vendas: VendaDTO[]; produtos: ProdutoDTO[] }) {
  const livres = produtos.filter((produto) => produto.classificacao === "LIVRE");
  const fatiasVenda = fatiasStatus(vendas);
  const filaPagamento = ordenarVendas(porStatus(vendas, "AGUARDANDO_PAGAMENTO"), false).slice(0, 8);
  const abertas = porStatus(vendas, "EM_ANDAMENTO").length;
  const topLivres = [...livres]
    .sort((a, b) => b.quantidadeEstoque - a.quantidadeEstoque)
    .slice(0, 7)
    .map((produto) => ({
      label: nomeCurto(produto.nome, 1),
      value: produto.quantidadeEstoque,
    }));
  const livresBaixo = [...livres]
    .sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque)
    .slice(0, 6);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Fila do caixa"
            descricao="O que está aberto e o que já pode receber pagamento."
            acao={<LinkVerTodos to="/vendas">Ver vendas</LinkVerTodos>}
          />
          {fatiasVenda.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasVenda} total="vendas" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma venda na fila do caixa.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            titulo="Produtos livres"
            descricao="Itens simples que o caixa pode incluir na venda."
          />
          {topLivres.length > 0 ? (
            <BarChart bars={topLivres} />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto livre disponível.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Aguardando pagamento"
            descricao="Vendas prontas para o caixa receber — as mais antigas primeiro."
            acao={
              <LinkVerTodos to="/vendas?status=AGUARDANDO_PAGAMENTO">Ver fila</LinkVerTodos>
            }
          />
          <MiniTable
            rows={filaPagamento}
            rowKey={(venda) => venda.id ?? venda.dataHora}
            vazio="Nenhuma venda aguardando pagamento."
            columns={[
              {
                key: "id",
                header: "Venda",
                render: (venda) =>
                  venda.id != null ? (
                    <Link
                      to={`/registrar-venda?venda=${venda.id}`}
                      className="font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-2"
                    >
                      #{venda.id}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">#—</span>
                  ),
              },
              {
                key: "data",
                header: "Desde",
                render: (venda) => (
                  <span className="text-ink-muted">{dataHora(venda.dataHora)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                fim: true,
                render: () => (
                  <Badge dot tone="green">
                    {statusVendaLabel.AGUARDANDO_PAGAMENTO}
                  </Badge>
                ),
              },
            ]}
          />
          {abertas > 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              {abertas} venda{abertas === 1 ? "" : "s"} ainda em aberto no balcão.
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            titulo="Estoque simples"
            descricao="Produtos livres com menos unidades — úteis na hora de montar a venda."
            acao={<LinkVerTodos to="/produtos">Ver catálogo</LinkVerTodos>}
          />
          <MiniTable
            rows={livresBaixo}
            rowKey={(produto) => produto.id}
            vazio="Nenhum produto livre no catálogo."
            columns={[
              {
                key: "nome",
                header: "Produto",
                render: (produto) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{produto.nome}</p>
                    <p className="truncate text-[11px] text-ink-muted">{produto.categoria}</p>
                  </div>
                ),
              },
              {
                key: "estoque",
                header: "Unidades",
                fim: true,
                render: (produto) => (
                  <span
                    className={`font-bold ${
                      produto.quantidadeEstoque <= 5 ? "text-brand-red" : "text-brand-green"
                    }`}
                  >
                    {produto.quantidadeEstoque}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}

function PainelFarmaceutico({
  vendas,
  produtos,
  vencendo,
  prescricoes,
}: {
  vendas: VendaDTO[];
  produtos: ProdutoDTO[];
  vencendo: ProdutoDTO[];
  prescricoes: PrescricaoDTO[];
}) {
  const faixas = [
    { label: "Vencidos", min: -Infinity, max: -1 },
    { label: "Até 7 dias", min: 0, max: 7 },
    { label: "8 a 15", min: 8, max: 15 },
    { label: "16 a 30", min: 16, max: 30 },
    { label: "Acima de 30", min: 31, max: Infinity },
  ].map((faixa) => ({
    label: faixa.label,
    value: produtos.filter((produto) => {
      const dias = diasAte(produto.validade);
      if (dias === null) return false;
      return dias >= faixa.min && dias <= faixa.max;
    }).length,
  }));

  const fatiasAvaliacao = [
    {
      label: "Em avaliação",
      value: porStatus(vendas, "EM_AVALIACAO").length,
      color: coresStatus.EM_AVALIACAO,
    },
    {
      label: "Avaliadas",
      value: vendas.filter(
        (venda) => venda.idFarmaceutico != null && venda.status !== "EM_AVALIACAO",
      ).length,
      color: coresStatus.FINALIZADA,
    },
    {
      label: "Demais",
      value: vendas.filter((venda) => venda.idFarmaceutico == null && venda.status !== "EM_AVALIACAO")
        .length,
      color: coresStatus.EM_ANDAMENTO,
    },
  ];

  const urgentes = [...(vencendo.length ? vencendo : produtos)]
    .map((produto) => ({ produto, dias: diasAte(produto.validade) }))
    .filter((item) => item.dias !== null && item.dias <= JANELA_VALIDADE_DIAS)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0))
    .slice(0, 8);

  const pendentes = ordenarVendas(porStatus(vendas, "EM_AVALIACAO")).slice(0, 8);
  const historico = ordenarVendas(
    vendas.filter((venda) => venda.idFarmaceutico != null && venda.status !== "EM_AVALIACAO"),
  ).slice(0, 8);
  const receitasUrgentes = [...prescricoes]
    .map((prescricao) => ({ prescricao, dias: diasAte(prescricao.dataValidade) }))
    .sort((a, b) => (a.dias ?? 99) - (b.dias ?? 99))
    .slice(0, 8);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Validade do estoque"
            descricao="O que já venceu e o que está perto de vencer — prioridade do farmacêutico."
            acao={<LinkVerTodos to="/produtos/validades">Ver validades</LinkVerTodos>}
          />
          {faixas.some((faixa) => faixa.value > 0) ? (
            <BarChart bars={faixas} accent="red" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto com data de validade carregado.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            titulo="Fila de avaliação"
            descricao="Vendas com prescritos ou controlados que precisam do seu aval."
            acao={<LinkVerTodos to="/avaliacoes">Avaliar</LinkVerTodos>}
          />
          {fatiasAvaliacao.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasAvaliacao} total="vendas" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma venda para acompanhar.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          titulo="Vencendo em breve"
          descricao="Produtos vencidos ou que saem da validade nos próximos 15 dias, dos mais urgentes aos demais."
          acao={<LinkVerTodos to="/produtos/validades">Ver todos</LinkVerTodos>}
        />
        <MiniTable
          rows={urgentes}
          rowKey={(item) => item.produto.id}
          vazio="Nenhum produto vencendo nos próximos 15 dias."
          columns={[
            {
              key: "nome",
              header: "Produto",
              render: (item) => (
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{item.produto.nome}</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    lote {item.produto.lote || "—"} · {item.produto.quantidadeEstoque} un.
                  </p>
                </div>
              ),
            },
            {
              key: "data",
              header: "Validade",
              render: (item) => (
                <span className="text-ink-muted">{formatarData(item.produto.validade)}</span>
              ),
            },
            {
              key: "prazo",
              header: "Prazo",
              fim: true,
              render: (item) => (
                <Badge tone={toneValidade(item.dias)}>{rotuloValidade(item.dias)}</Badge>
              ),
            },
          ]}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Vendas para avaliar"
            descricao="Itens prescritos ou controlados aguardando decisão."
            acao={<LinkVerTodos to="/avaliacoes">Abrir avaliações</LinkVerTodos>}
          />
          <MiniTable
            rows={pendentes}
            rowKey={(venda) => venda.id ?? venda.dataHora}
            vazio="Nenhuma venda em avaliação."
            columns={[
              {
                key: "id",
                header: "Venda",
                render: (venda) =>
                  venda.id != null ? (
                    <Link
                      to={`/avaliacoes?venda=${venda.id}`}
                      className="font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-2"
                    >
                      #{venda.id}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">#—</span>
                  ),
              },
              {
                key: "data",
                header: "Quando",
                render: (venda) => (
                  <span className="text-ink-muted">{dataHora(venda.dataHora)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                fim: true,
                render: () => (
                  <Badge dot tone="amber">
                    {statusVendaLabel.EM_AVALIACAO}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader
            titulo="Histórico avaliado"
            descricao="Vendas que já passaram pela sua avaliação."
            acao={<LinkVerTodos to="/vendas">Ver vendas</LinkVerTodos>}
          />
          <MiniTable
            rows={historico}
            rowKey={(venda) => venda.id ?? venda.dataHora}
            vazio="Ainda não há vendas avaliadas."
            columns={[
              {
                key: "id",
                header: "Venda",
                render: (venda) => (
                  <span className="font-semibold text-ink">#{venda.id ?? "—"}</span>
                ),
              },
              {
                key: "data",
                header: "Quando",
                render: (venda) => (
                  <span className="text-ink-muted">{dataHora(venda.dataHora)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                fim: true,
                render: (venda) => (
                  <Badge dot tone={statusTone(venda.status)}>
                    {statusVendaLabel[venda.status]}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <Card>
        <CardHeader
          titulo="Prescrições sob vigilância"
          descricao="Receitas pela data de validade — as que vencem primeiro aparecem no topo."
          acao={<LinkVerTodos to="/prescricoes">Ver prescrições</LinkVerTodos>}
        />
        <MiniTable
          rows={receitasUrgentes}
          rowKey={(item) => item.prescricao.id}
          vazio="Nenhuma prescrição cadastrada."
          columns={[
            {
              key: "paciente",
              header: "Paciente",
              render: (item) => (
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{item.prescricao.nomePaciente}</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    {item.prescricao.numeroPrescricao} · Dr(a). {item.prescricao.nomeMedico}
                  </p>
                </div>
              ),
            },
            {
              key: "venda",
              header: "Venda",
              render: (item) => (
                <span className="text-ink-muted">#{item.prescricao.vendaId}</span>
              ),
            },
            {
              key: "retida",
              header: "Retenção",
              render: (item) => (
                <Badge tone={item.prescricao.retida ? "green" : "amber"}>
                  {item.prescricao.retida ? "Retida" : "Pendente"}
                </Badge>
              ),
            },
            {
              key: "prazo",
              header: "Validade",
              fim: true,
              render: (item) => (
                <Badge tone={toneValidade(item.dias)}>{rotuloValidade(item.dias)}</Badge>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

function PainelGerente({
  produtos,
  usuarios,
}: {
  produtos: ProdutoDTO[];
  usuarios: UsuarioDTO[];
}) {
  const ativos = produtos.filter((produto) => produto.isActive);
  const semEstoque = produtos
    .filter((produto) => produto.isActive && produto.quantidadeEstoque <= 0)
    .slice(0, 8);
  const estoqueCritico = [...produtos]
    .filter((produto) => produto.isActive)
    .sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque)
    .slice(0, 6);
  const topEstoque = [...produtos]
    .sort((a, b) => b.quantidadeEstoque - a.quantidadeEstoque)
    .slice(0, 7)
    .map((produto) => ({
      label: nomeCurto(produto.nome, 1),
      value: produto.quantidadeEstoque,
    }));
  const fatiasEquipe = PERFIS.map((perfil) => ({
    label: perfilLabel[perfil],
    value: usuarios.filter((membro) => membro.perfil === perfil).length,
    color: coresPerfil[perfil],
  }));
  const fatiasTarja = fatiasClassificacao(produtos);
  const inativos = usuarios.filter((membro) => !membro.isActive);
  const valorEstoque = produtos.reduce(
    (soma, produto) => soma + Number(produto.preco) * produto.quantidadeEstoque,
    0,
  );
  const equipe = [...usuarios].sort((a, b) => Number(b.isActive) - Number(a.isActive)).slice(0, 8);

  const pontosEstoque =
    estoqueCritico.length > 0
      ? [...estoqueCritico]
          .reverse()
          .map((produto) => produto.quantidadeEstoque)
      : [0];
  const rotulosEstoque = [...estoqueCritico].reverse().map((produto) => nomeCurto(produto.nome, 1));

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Equipe cadastrada"
            descricao="Distribuição dos usuários por perfil de acesso."
            acao={<LinkVerTodos to="/usuarios">Gerenciar</LinkVerTodos>}
          />
          {fatiasEquipe.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasEquipe} total="usuários" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum usuário carregado.</p>
          )}
          {inativos.length > 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              <strong className="font-semibold text-ink">{inativos.length}</strong>{" "}
              {inativos.length === 1 ? "acesso inativo" : "acessos inativos"} — convém revisar o cadastro.
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            titulo="Estoque por produto"
            descricao="Os sete itens com maior quantidade em casa."
            acao={
              <span className="flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-muted">
                <span className="size-2 rounded-full bg-brand-green" /> unidades
              </span>
            }
          />
          {topEstoque.length > 0 ? (
            <BarChart bars={topEstoque} />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto cadastrado.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            titulo="Catálogo por tarja"
            descricao="Como o estoque está dividido entre livre, prescrito e controlado."
            acao={<LinkVerTodos to="/produtos">Ver produtos</LinkVerTodos>}
          />
          {fatiasTarja.some((fatia) => fatia.value > 0) ? (
            <DonutChart slices={fatiasTarja} total="produtos" />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto cadastrado.</p>
          )}
          <p className="mt-4 text-sm text-ink-muted">
            {ativos.length} ativos · valor em estoque {moeda(valorEstoque)}
          </p>
        </Card>

        <Card>
          <CardHeader
            titulo="Estoque crítico"
            descricao="Itens ativos com menos unidades — candidatos a uma entrada."
          />
          {estoqueCritico.length > 0 ? (
            <AreaChart points={pontosEstoque} labels={rotulosEstoque} />
          ) : (
            <p className="text-sm text-ink-muted">Nenhum produto ativo para acompanhar.</p>
          )}
          <ul className="mt-4 space-y-2">
            {estoqueCritico.slice(0, 4).map((produto) => (
              <li key={produto.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-ink">{produto.nome}</span>
                <span
                  className={`shrink-0 font-bold ${
                    produto.quantidadeEstoque <= 5 ? "text-brand-red" : "text-brand-green"
                  }`}
                >
                  {produto.quantidadeEstoque} un.
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Usuários"
            descricao="Quem já está cadastrado e quem está com o acesso inativo."
            acao={<LinkVerTodos to="/usuarios">Cadastrar</LinkVerTodos>}
          />
          <MiniTable
            rows={equipe}
            rowKey={(membro) => membro.id}
            vazio="Nenhum usuário cadastrado."
            columns={[
              {
                key: "nome",
                header: "Nome",
                render: (membro) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{membro.nome}</p>
                    <p className="truncate text-[11px] text-ink-muted">{membro.email}</p>
                  </div>
                ),
              },
              {
                key: "perfil",
                header: "Perfil",
                render: (membro) => (
                  <Badge dot tone={tonePerfil(membro.perfil)}>
                    {perfilLabel[membro.perfil]}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "Acesso",
                fim: true,
                render: (membro) => (
                  <Badge dot tone={membro.isActive ? "green" : "neutral"}>
                    {membro.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader
            titulo="Entrada de estoque"
            descricao="Produtos ativos zerados — precisam de reposição."
            acao={<LinkVerTodos to="/produtos">Dar entrada</LinkVerTodos>}
          />
          <MiniTable
            rows={semEstoque}
            rowKey={(produto) => produto.id}
            vazio="Nenhum produto ativo está zerado."
            columns={[
              {
                key: "nome",
                header: "Produto",
                render: (produto) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{produto.nome}</p>
                    <p className="truncate text-[11px] text-ink-muted">{produto.categoria}</p>
                  </div>
                ),
              },
              {
                key: "tarja",
                header: "Tarja",
                render: (produto) => (
                  <Badge tone={toneClassificacao(produto.classificacao)}>
                    {classificacaoLabel[produto.classificacao]}
                  </Badge>
                ),
              },
              {
                key: "estoque",
                header: "Estoque",
                fim: true,
                render: () => <span className="font-bold text-brand-red">0 un.</span>,
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
