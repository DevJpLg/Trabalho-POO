import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import type { Classificacao, ProdutoDTO, ProdutoInput } from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Input, Select, Textarea } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { pageTitles } from "../../../shared/ui/nav";
import { IconAlert, IconPills, IconPlus, IconShield } from "../../../shared/ui/icons";
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
  formulaFarmaceutica: "",
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

function classificacaoTone(c: Classificacao) {
  if (c === "LIVRE") return "green" as const;
  if (c === "CONTROLADO") return "red" as const;
  return "amber" as const;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
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
    formulaFarmaceutica: p.formulaFarmaceutica ?? "",
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

type ListMode = "todos" | "vendaveis" | "validades";

export function ProdutosPage() {
  const location = useLocation();
  const { http } = useAuth();
  const [params] = useSearchParams();
  const somenteBloqueados = params.get("ativo") === "false";
  usePageTitle(
    somenteBloqueados ? "Produtos bloqueados" : (pageTitles[location.pathname] ?? "Produtos"),
  );
  const service = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);

  const pathMode: ListMode = location.pathname.endsWith("/validades") ? "validades" : "todos";
  const [mode, setMode] = useState<ListMode>(pathMode);
  const [busca, setBusca] = useState(params.get("q") ?? "");
  const [rows, setRows] = useState<ProdutoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProdutoDTO | null>(null);
  const [form, setForm] = useState<ProdutoInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [stockModal, setStockModal] = useState<{
    produto: ProdutoDTO;
    kind: "entrada" | "baixa" | "validade";
  } | null>(null);
  const [stockValue, setStockValue] = useState("");

  async function load(nextMode = mode, nextBusca = busca) {
    setLoading(true);
    setError(null);
    try {
      if (nextMode === "validades") {
        setRows(await service.listarValidades());
      } else if (nextMode === "vendaveis") {
        setRows(await service.buscarVendaveis(nextBusca));
      } else {
        setRows(await service.listar(nextBusca));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = params.get("q") ?? "";
    setBusca(q);
    const nextMode: ListMode = location.pathname.endsWith("/validades") ? "validades" : "todos";
    setMode(nextMode);
    void load(nextMode, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, location.pathname]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(produto: ProdutoDTO) {
    setEditing(produto);
    setForm(produtoToForm(produto));
    setModalOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editing) {
        const result = await service.editar(editing.id, form);
        setSuccess(result.message);
      } else {
        const result = await service.cadastrar(form);
        setSuccess(result.message);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(produto: ProdutoDTO) {
    if (!confirm(`Excluir o produto ${produto.nome}?`)) return;
    try {
      await service.deletar(produto.id);
      setSuccess("Produto removido.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onBloquear(produto: ProdutoDTO) {
    try {
      const result = await service.bloquear(produto.id);
      setSuccess(result.message);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const visiveis = somenteBloqueados ? rows.filter((p) => !p.isActive) : rows;

  async function onStockSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stockModal) return;
    setSaving(true);
    setError(null);
    try {
      const { produto, kind } = stockModal;
      if (kind === "entrada") {
        const result = await service.entrada(produto.id, Number(stockValue));
        setSuccess(result?.message ?? "Entrada registrada.");
      } else if (kind === "baixa") {
        const result = await service.baixa(produto.id, Number(stockValue));
        setSuccess(result.message);
      } else {
        const result = await service.alterarValidade(produto.id, stockValue);
        setSuccess(result.message);
      }
      setStockModal(null);
      setStockValue("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        description={
          somenteBloqueados
            ? "Listando apenas produtos bloqueados (inativos)."
            : "Estoque, validade e classificação de medicamentos."
        }
        actions={
          <Button type="button" onClick={openCreate}>
            <IconPlus size={16} /> Novo produto
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={visiveis.length} icon={<IconPills />} tone="green" />
        <StatCard
          label="Ativos"
          value={visiveis.filter((p) => p.isActive).length}
          icon={<IconPills />}
          tone="mint"
        />
        <StatCard
          label="Estoque baixo"
          value={visiveis.filter((p) => p.quantidadeEstoque <= 5).length}
          icon={<IconAlert />}
          tone="red"
        />
        <StatCard
          label="Bloqueados"
          value={visiveis.filter((p) => !p.isActive).length}
          icon={<IconShield />}
          tone="rose"
        />
      </div>

      {mode !== "validades" ? (
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void load(mode, busca);
          }}
        >
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, código de barras, princípio ativo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
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
          rows={visiveis}
          rowKey={(p) => p.id}
          emptyMessage={somenteBloqueados ? "Nenhum produto bloqueado." : "Nenhum registro."}
          columns={[
            { key: "id", header: "ID", render: (p) => p.id },
            {
              key: "nome",
              header: "Produto",
              render: (p) => (
                <div>
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-xs text-ink-muted">{p.codigoBarras}</p>
                </div>
              ),
            },
            {
              key: "classificacao",
              header: "Classificação",
              render: (p) => (
                <Badge tone={classificacaoTone(p.classificacao)}>{p.classificacao}</Badge>
              ),
            },
            {
              key: "estoque",
              header: "Estoque",
              render: (p) => (
                <span className={p.quantidadeEstoque <= 5 ? "font-semibold text-brand-red" : ""}>
                  {p.quantidadeEstoque}
                </span>
              ),
            },
            {
              key: "preco",
              header: "Preço",
              render: (p) =>
                Number(p.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            },
            {
              key: "ativo",
              header: "Status",
              render: (p) => (
                <Badge tone={p.isActive ? "green" : "red"}>
                  {p.isActive ? "Ativo" : "Bloqueado"}
                </Badge>
              ),
            },
            {
              key: "acoes",
              header: "Ações",
              className: "min-w-64",
              render: (p) => (
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="secondary" onClick={() => openEdit(p)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => {
                      setStockModal({ produto: p, kind: "entrada" });
                      setStockValue("");
                    }}
                  >
                    Entrada
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStockModal({ produto: p, kind: "baixa" });
                      setStockValue("");
                    }}
                  >
                    Baixa
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStockModal({ produto: p, kind: "validade" });
                      setStockValue(toDateInput(p.validade));
                    }}
                  >
                    Validade
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void onBloquear(p)}>
                    {p.isActive ? "Bloquear" : "Desbloquear"}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void onDelete(p)}>
                    Excluir
                  </Button>
                </div>
              ),
            },
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
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
          <Input
            label="Código de barras"
            required
            value={form.codigoBarras}
            onChange={(e) => setForm((f) => ({ ...f, codigoBarras: e.target.value }))}
          />
          <Input
            label="Princípio ativo"
            required
            value={form.principioAtivo}
            onChange={(e) => setForm((f) => ({ ...f, principioAtivo: e.target.value }))}
          />
          <Input
            label="Fabricante"
            required
            value={form.fabricante}
            onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
          />
          <Input
            label="Categoria"
            required
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          />
          <Input
            label="Preço"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.preco}
            onChange={(e) => setForm((f) => ({ ...f, preco: Number(e.target.value) }))}
          />
          <Select
            label="Classificação"
            options={classificacaoOptions}
            value={form.classificacao ?? "LIVRE"}
            onChange={(e) =>
              setForm((f) => ({ ...f, classificacao: e.target.value as Classificacao }))
            }
          />
          <Input
            label="Estoque"
            type="number"
            min="0"
            value={form.quantidadeEstoque ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, quantidadeEstoque: Number(e.target.value) }))}
          />
          <Input
            label="Concentração"
            value={form.concentracao ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, concentracao: e.target.value }))}
          />
          <Input
            label="Forma farmacêutica"
            value={form.formulaFarmaceutica ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, formulaFarmaceutica: e.target.value }))}
          />
          <Input
            label="Registro ANVISA"
            value={form.numeroRegAnvisa ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, numeroRegAnvisa: e.target.value }))}
          />
          <Input
            label="Tarja"
            value={form.tarja ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, tarja: e.target.value }))}
          />
          <Input
            label="Local estoque"
            value={form.localEstoque ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, localEstoque: e.target.value }))}
          />
          <Input
            label="Lote"
            value={form.lote ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
          />
          <Input
            label="Validade"
            type="date"
            value={form.validade ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, validade: e.target.value }))}
          />
          <Input
            label="Fabricação"
            type="date"
            value={form.dataFabricacao ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dataFabricacao: e.target.value }))}
          />
          <Input
            label="Classe de controle"
            value={form.classeControle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, classeControle: e.target.value }))}
          />
          <Input
            label="Validade receita (dias)"
            type="number"
            value={form.validadeReceita ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                validadeReceita: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Qtd. máxima"
            type="number"
            value={form.quantidadeMaxima ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                quantidadeMaxima: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.retencaoReceita)}
              onChange={(e) => setForm((f) => ({ ...f, retencaoReceita: e.target.checked }))}
            />
            Retenção de receita
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.generico)}
              onChange={(e) => setForm((f) => ({ ...f, generico: e.target.checked }))}
            />
            Genérico
          </label>
          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              value={form.descricao ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(stockModal)}
        title={
          stockModal?.kind === "entrada"
            ? "Entrada de estoque"
            : stockModal?.kind === "baixa"
              ? "Baixa de estoque"
              : "Alterar validade"
        }
        onClose={() => setStockModal(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setStockModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="stock-form" disabled={saving}>
              Confirmar
            </Button>
          </>
        }
      >
        <form id="stock-form" className="space-y-3" onSubmit={onStockSubmit}>
          <p className="text-sm text-ink-muted">{stockModal?.produto.nome}</p>
          {stockModal?.kind === "validade" ? (
            <Input
              label="Nova validade"
              type="date"
              required
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
            />
          ) : (
            <Input
              label="Quantidade"
              type="number"
              min="1"
              required
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
