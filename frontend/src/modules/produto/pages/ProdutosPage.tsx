import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import {
  podeControlarValidade,
  podeDarEntradaEstoque,
  podeGerenciarProdutos,
  usaCatalogoCompleto,
} from "../../../shared/auth/permissoes";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  classificacaoLabel,
  type Classificacao,
  type ProdutoDTO,
  type ProdutoInput,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button, IconButton } from "../../../shared/ui/Button";
import { data as formatarData, diasAte, moeda, paraInputDate } from "../../../shared/ui/format";
import { Checkbox, Input, Textarea } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { DateInput } from "../../../shared/ui/DateInput";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconLock,
  IconPencil,
  IconPills,
  IconPlus,
  IconSearch,
  IconShield,
  IconTrash,
  IconUnlock,
} from "../../../shared/ui/icons";
import { produtoParaInput } from "../produto.mapper";
import { ProdutoRepository } from "../produto.repository";
import { ProdutoService } from "../produto.service";

const classificacaoOptions = [
  { value: "LIVRE", label: "Livre" },
  { value: "PRESCRITO", label: "Prescrito" },
  { value: "CONTROLADO", label: "Controlado" },
];

const emptyForm: ProdutoInput = {
  nome: "",
  codigoBarras: "",
  principioAtivo: "",
  fabricante: "",
  categoria: "",
  preco: 0,
  descricao: "",
  concentracao: "",
  formaFarmaceutica: "",
  numeroRegAnvisa: "",
  tarja: "",
  classificacao: "LIVRE",
  quantidadeEstoque: 0,
  localEstoque: "",
  validade: "",
  classeControle: "",
  retencaoReceita: false,
  validadeReceita: null,
  generico: false,
  lote: "",
  dataFabricacao: "",
  quantidadeMaxima: null,
  isActive: true,
};

function classificacaoTone(classificacao: Classificacao) {
  if (classificacao === "LIVRE") return "green" as const;
  if (classificacao === "CONTROLADO") return "red" as const;
  return "amber" as const;
}

/** A tela serve três rotas; o modo decide a fonte de dados e o texto de apoio. */
type ModoLista = "catalogo" | "entrada" | "validades";

function modoDaRota(pathname: string): ModoLista {
  if (pathname.endsWith("/validades")) return "validades";
  if (pathname.endsWith("/entrada")) return "entrada";
  return "catalogo";
}

function produtoToForm(p: ProdutoDTO): ProdutoInput {
  return {
    nome: p.nome,
    codigoBarras: p.codigoBarras,
    principioAtivo: p.principioAtivo,
    fabricante: p.fabricante,
    categoria: p.categoria,
    preco: Number(p.preco),
    descricao: p.descricao ?? "",
    concentracao: p.concentracao ?? "",
    formaFarmaceutica: p.formaFarmaceutica ?? "",
    numeroRegAnvisa: p.numeroRegAnvisa ?? "",
    tarja: p.tarja ?? "",
    classificacao: p.classificacao,
    quantidadeEstoque: p.quantidadeEstoque,
    localEstoque: p.localEstoque ?? "",
    validade: toDateInput(p.validade),
    classeControle: p.classeControle ?? "",
    retencaoReceita: p.retencaoReceita,
    validadeReceita: p.validadeReceita,
    generico: p.generico,
    lote: p.lote ?? "",
    dataFabricacao: toDateInput(p.dataFabricacao),
    quantidadeMaxima: p.quantidadeMaxima,
    isActive: p.isActive,
  };
}
const descricaoPorModo: Record<ModoLista, string> = {
  catalogo: "Estoque, validade e classificação de medicamentos.",
  entrada: "Registre a entrada de mercadoria no estoque de cada produto.",
  validades: "Produtos que vencem nos próximos 30 dias, do mais urgente para o menos.",
};

/** Operações de estoque que compartilham o mesmo modal. */
type AcaoEstoque = "entrada" | "baixa" | "validade";

const tituloAcao: Record<AcaoEstoque, string> = {
  entrada: "Entrada de estoque",
  baixa: "Baixa de estoque",
  validade: "Alterar validade",
};

export function ProdutosPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { http, usuario } = useAuth();
  const perfil = usuario?.perfil;

  const gerenciaProdutos = podeGerenciarProdutos(perfil);
  const daEntrada = podeDarEntradaEstoque(perfil);
  const controlaValidade = podeControlarValidade(perfil);
  const catalogoCompleto = usaCatalogoCompleto(perfil);

  const modo = modoDaRota(location.pathname);
  const titulo =
    modo === "validades"
      ? "Controle de Validades"
      : modo === "entrada"
        ? "Entrada de Produtos"
        : catalogoCompleto
          ? "Todos os Produtos"
          : "Consultar Produtos";
  usePageTitle(titulo);

  const service = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);

  const [busca, setBusca] = useState(params.get("q") ?? "");
  const [rows, setRows] = useState<ProdutoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProdutoDTO | null>(null);
  const [form, setForm] = useState<ProdutoInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [acaoEstoque, setAcaoEstoque] = useState<{ produto: ProdutoDTO; tipo: AcaoEstoque } | null>(
    null,
  );
  const [valorAcao, setValorAcao] = useState("");

  const load = useCallback(
    async (termo: string) => {
      setLoading(true);
      setError(null);
      try {
        const lista =
          modo === "validades"
            ? await service.listarValidades()
            : await service.listarPorPerfil(catalogoCompleto, termo);
        setRows(lista);
      } catch (err) {
        setError(getErrorMessage(err));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [service, modo, catalogoCompleto],
  );

  useEffect(() => {
    const termo = params.get("q") ?? "";
    setBusca(termo);
    void load(termo);
  }, [load, params]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(produto: ProdutoDTO) {
    setEditing(produto);
    setForm(produtoParaInput(produto));
    setModalOpen(true);
  }

  function abrirAcao(produto: ProdutoDTO, tipo: AcaoEstoque) {
    setAcaoEstoque({ produto, tipo });
    setValorAcao(tipo === "validade" ? paraInputDate(produto.validade) : "");
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const resultado = editing
        ? await service.editar(editing.id, form)
        : await service.cadastrar(form);
      setSuccess(resultado.message);
      setModalOpen(false);
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(produto: ProdutoDTO) {
    if (!confirm(`Excluir o produto ${produto.nome}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await service.deletar(produto.id);
      setSuccess("Produto removido.");
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onBloquear(produto: ProdutoDTO) {
    setError(null);
    setSuccess(null);
    try {
      const resultado = await service.bloquear(produto.id);
      setSuccess(resultado.message);
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onAcaoSubmit(event: FormEvent) {
    event.preventDefault();
    if (!acaoEstoque) return;

    const { produto, tipo } = acaoEstoque;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (tipo === "entrada") {
        setSuccess(await service.entrada(produto, Number(valorAcao)));
      } else if (tipo === "baixa") {
        const resultado = await service.baixa(produto, Number(valorAcao));
        setSuccess(resultado.message);
      } else {
        const resultado = await service.alterarValidade(produto, valorAcao);
        setSuccess(resultado.message);
      }
      setAcaoEstoque(null);
      setValorAcao("");
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const vencidos = rows.filter((produto) => {
    const dias = diasAte(produto.validade);
    return dias !== null && dias < 0;
  }).length;

  const mostraAcoes = gerenciaProdutos || daEntrada || controlaValidade;

  return (
    <div>
      <PageHeader
        description={descricaoPorModo[modo]}
        actions={
          gerenciaProdutos ? (
            <Button type="button" onClick={openCreate}>
              <IconPlus size={16} /> Novo produto
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listados" value={rows.length} icon={<IconPills />} tone="green" />
        <StatCard
          label="Ativos"
          value={rows.filter((produto) => produto.isActive).length}
          icon={<IconPills />}
          tone="mint"
        />
        <StatCard
          label={modo === "validades" ? "Já vencidos" : "Estoque baixo"}
          value={
            modo === "validades"
              ? vencidos
              : rows.filter((produto) => produto.quantidadeEstoque <= 5).length
          }
          icon={<IconAlert />}
          tone="red"
        />
        <StatCard
          label="Bloqueados"
          value={rows.filter((produto) => !produto.isActive).length}
          icon={<IconShield />}
          tone="rose"
        />
      </div>

      {modo !== "validades" ? (
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void load(busca);
          }}
        >
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, código de barras, princípio ativo..."
              icone={<IconSearch size={17} />}
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      ) : null}

      {!catalogoCompleto && modo === "catalogo" ? (
        <div className="mb-4">
          <Alert tone="info">
            Consulta do catálogo vendável: só aparecem produtos ativos, dentro da validade e com
            estoque disponível.
          </Alert>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <Alert tone="success">{success}</Alert>
        </div>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(produto) => produto.id}
          empty={
            modo === "validades" ? (
              <EmptyState
                icone={<IconCalendar size={22} />}
                titulo="Nada vencendo por enquanto"
                descricao="Nenhum produto entra em validade crítica nos próximos 30 dias."
              />
            ) : (
              <EmptyState
                icone={<IconPills size={22} />}
                titulo={busca ? "Nenhum produto para essa busca" : "Catálogo vazio"}
                descricao={
                  busca
                    ? "Revise o termo ou limpe a busca para ver o catálogo completo."
                    : catalogoCompleto
                      ? "Cadastre o primeiro produto para começar a controlar o estoque."
                      : "Nenhum produto ativo, dentro da validade e com estoque disponível."
                }
                acao={
                  gerenciaProdutos && !busca ? (
                    <Button type="button" onClick={openCreate}>
                      <IconPlus size={16} /> Novo produto
                    </Button>
                  ) : undefined
                }
              />
            )
          }
          columns={[
            { key: "id", header: "ID", render: (produto) => produto.id },
            {
              key: "nome",
              header: "Produto",
              className: "min-w-56",
              render: (produto) => (
                <div>
                  <p className="font-semibold">{produto.nome}</p>
                  <p className="text-xs text-ink-muted">{produto.codigoBarras}</p>
                </div>
              ),
            },
            {
              key: "classificacao",
              header: "Classificação",
              render: (produto) => (
                <Badge tone={classificacaoTone(produto.classificacao)}>
                  {classificacaoLabel[produto.classificacao]}
                </Badge>
              ),
            },
            {
              key: "estoque",
              header: "Estoque",
              render: (produto) => (
                <span
                  className={produto.quantidadeEstoque <= 5 ? "font-semibold text-brand-red" : ""}
                >
                  {produto.quantidadeEstoque}
                </span>
              ),
            },
            {
              key: "validade",
              header: "Validade",
              render: (produto) => {
                const dias = diasAte(produto.validade);
                const critico = dias !== null && dias <= 30;
                return (
                  <span className={critico ? "font-semibold text-brand-red" : "text-ink"}>
                    {formatarData(produto.validade)}
                    {dias !== null && dias < 0 ? " · vencido" : ""}
                  </span>
                );
              },
            },
            {
              key: "preco",
              header: "Preço",
              render: (produto) => moeda(produto.preco),
            },
            {
              key: "ativo",
              header: "Status",
              render: (produto) => (
                <Badge tone={produto.isActive ? "green" : "red"}>
                  {produto.isActive ? "Ativo" : "Bloqueado"}
                </Badge>
              ),
            },
            ...(mostraAcoes
              ? [
                  {
                    key: "acoes",
                    header: "Ações",
                    fim: true,
                    className: "min-w-40",
                    render: (produto: ProdutoDTO) => (
                      <RowActions>
                        {gerenciaProdutos ? (
                          <IconButton label="Editar produto" onClick={() => openEdit(produto)}>
                            <IconPencil size={17} />
                          </IconButton>
                        ) : null}
                        {daEntrada ? (
                          <IconButton
                            label="Entrada de estoque"
                            tone="success"
                            onClick={() => abrirAcao(produto, "entrada")}
                          >
                            <IconArrowDown size={17} />
                          </IconButton>
                        ) : null}
                        {gerenciaProdutos ? (
                          <>
                            <IconButton
                              label="Baixa de estoque"
                              onClick={() => abrirAcao(produto, "baixa")}
                            >
                              <IconArrowUp size={17} />
                            </IconButton>
                            <IconButton
                              label="Alterar validade"
                              onClick={() => abrirAcao(produto, "validade")}
                            >
                              <IconCalendar size={17} />
                            </IconButton>
                          </>
                        ) : null}
                        {controlaValidade ? (
                          <IconButton
                            label={produto.isActive ? "Bloquear produto" : "Desbloquear produto"}
                            onClick={() => void onBloquear(produto)}
                          >
                            {produto.isActive ? <IconLock size={17} /> : <IconUnlock size={17} />}
                          </IconButton>
                        ) : null}
                        {gerenciaProdutos ? (
                          <IconButton
                            label="Excluir produto"
                            tone="danger"
                            onClick={() => void onDelete(produto)}
                          >
                            <IconTrash size={17} />
                          </IconButton>
                        ) : null}
                      </RowActions>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar produto" : "Novo produto"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="produto-form" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="produto-form" className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="Nome"
            required
            value={form.nome}
            onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
          />
          <Input
            label="Código de barras"
            required
            value={form.codigoBarras}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, codigoBarras: event.target.value }))
            }
          />
          <Input
            label="Princípio ativo"
            required
            value={form.principioAtivo}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, principioAtivo: event.target.value }))
            }
          />
          <Input
            label="Fabricante"
            required
            value={form.fabricante}
            onChange={(event) => setForm((atual) => ({ ...atual, fabricante: event.target.value }))}
          />
          <Input
            label="Categoria"
            required
            value={form.categoria}
            onChange={(event) => setForm((atual) => ({ ...atual, categoria: event.target.value }))}
          />
          <Input
            label="Registro ANVISA"
            required
            value={form.numeroRegAnvisa ?? ""}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, numeroRegAnvisa: event.target.value }))
            }
          />
          <Input
            label="Preço (R$)"
            type="number"
            step="0.01"
            min="0"
            required
            value={String(form.preco)}
            onChange={(event) => setForm((atual) => ({ ...atual, preco: Number(event.target.value) }))}
          />
          <Select
            label="Classificação"
            options={classificacaoOptions}
            value={form.classificacao ?? "LIVRE"}
            onChange={(valor) =>
              setForm((atual) => ({ ...atual, classificacao: valor as Classificacao }))
            }
          />
          <DateInput
            label="Data de fabricação"
            required
            value={form.dataFabricacao ?? ""}
            onChange={(iso) => setForm((atual) => ({ ...atual, dataFabricacao: iso }))}
          />
          <DateInput
            label="Validade"
            required
            value={form.validade ?? ""}
            onChange={(iso) => setForm((atual) => ({ ...atual, validade: iso }))}
          />
          <Input
            label="Quantidade em estoque"
            type="number"
            min="0"
            value={String(form.quantidadeEstoque ?? 0)}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, quantidadeEstoque: Number(event.target.value) }))
            }
          />
          <Input
            label="Quantidade máxima por venda"
            type="number"
            min="0"
            value={form.quantidadeMaxima == null ? "" : String(form.quantidadeMaxima)}
            onChange={(event) =>
              setForm((atual) => ({
                ...atual,
                quantidadeMaxima: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          />
          <Input
            label="Concentração"
            value={form.concentracao ?? ""}
            onChange={(event) => setForm((atual) => ({ ...atual, concentracao: event.target.value }))}
          />
          <Input
            label="Forma farmacêutica"
            value={form.formaFarmaceutica ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, formaFarmaceutica: e.target.value }))}
          />
          <Input
            label="Registro ANVISA"
            value={form.numeroRegAnvisa ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, numeroRegAnvisa: e.target.value }))}
          />
          <Input
            label="Tarja"
            value={form.tarja ?? ""}
            onChange={(event) => setForm((atual) => ({ ...atual, tarja: event.target.value }))}
          />
          <Input
            label="Classe de controle"
            value={form.classeControle ?? ""}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, classeControle: event.target.value }))
            }
          />
          <Input
            label="Lote"
            value={form.lote ?? ""}
            onChange={(event) => setForm((atual) => ({ ...atual, lote: event.target.value }))}
          />
          <Input
            label="Local no estoque"
            value={form.localEstoque ?? ""}
            onChange={(event) => setForm((atual) => ({ ...atual, localEstoque: event.target.value }))}
          />
          <Input
            label="Validade da receita (dias)"
            type="number"
            min="0"
            value={form.validadeReceita == null ? "" : String(form.validadeReceita)}
            onChange={(event) =>
              setForm((atual) => ({
                ...atual,
                validadeReceita: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          />

          <div className="flex flex-wrap items-end gap-5 rounded-2xl bg-surface-muted px-4 py-3 sm:col-span-2">
            <Checkbox
              label="Exige retenção de receita"
              checked={Boolean(form.retencaoReceita)}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, retencaoReceita: event.target.checked }))
              }
            />
            <Checkbox
              label="Genérico"
              checked={Boolean(form.generico)}
              onChange={(event) => setForm((atual) => ({ ...atual, generico: event.target.checked }))}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              value={form.descricao ?? ""}
              onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={acaoEstoque !== null}
        title={
          acaoEstoque
            ? `${tituloAcao[acaoEstoque.tipo]} · ${acaoEstoque.produto.nome}`
            : "Movimentação de estoque"
        }
        onClose={() => setAcaoEstoque(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setAcaoEstoque(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="acao-estoque-form"
              variant={acaoEstoque?.tipo === "entrada" ? "success" : "primary"}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <form id="acao-estoque-form" className="space-y-3" onSubmit={onAcaoSubmit}>
          {acaoEstoque ? (
            <p className="text-sm text-ink-muted">
              Estoque atual:{" "}
              <strong className="text-ink">{acaoEstoque.produto.quantidadeEstoque}</strong> unidades
              · validade atual:{" "}
              <strong className="text-ink">{formatarData(acaoEstoque.produto.validade)}</strong>
            </p>
          ) : null}

          {acaoEstoque?.tipo === "validade" ? (
            <DateInput
              label="Nova validade"
              required
              value={valorAcao}
              onChange={(iso) => setValorAcao(iso)}
            />
          ) : (
            <Input
              label={
                acaoEstoque?.tipo === "baixa"
                  ? "Quantidade a retirar"
                  : "Quantidade a adicionar"
              }
              type="number"
              min="1"
              step="1"
              required
              value={valorAcao}
              onChange={(event) => setValorAcao(event.target.value)}
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
