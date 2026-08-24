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
import { data as formatarData, diasAte, moeda } from "../../../shared/ui/format";
import { Checkbox, Input, Textarea } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { DateInput } from "../../../shared/ui/DateInput";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import {
  IconArrowDown,
  IconCalendar,
  IconEye,
  IconLock,
  IconPencil,
  IconPills,
  IconPlus,
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

function FormularioProduto({
  form,
  setForm,
  disabled = false,
  mostrarStatus = false,
}: {
  form: ProdutoInput;
  setForm: (atualizar: (atual: ProdutoInput) => ProdutoInput) => void;
  disabled?: boolean;
  mostrarStatus?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Input
        label="Nome"
        required
        disabled={disabled}
        value={form.nome}
        onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
      />
      <Input
        label="Código de barras"
        required
        disabled={disabled}
        value={form.codigoBarras}
        onChange={(event) => setForm((atual) => ({ ...atual, codigoBarras: event.target.value }))}
      />
      <Input
        label="Princípio ativo"
        required
        disabled={disabled}
        value={form.principioAtivo}
        onChange={(event) => setForm((atual) => ({ ...atual, principioAtivo: event.target.value }))}
      />
      <Input
        label="Fabricante"
        required
        disabled={disabled}
        value={form.fabricante}
        onChange={(event) => setForm((atual) => ({ ...atual, fabricante: event.target.value }))}
      />
      <Input
        label="Categoria"
        required
        disabled={disabled}
        value={form.categoria}
        onChange={(event) => setForm((atual) => ({ ...atual, categoria: event.target.value }))}
      />
      <Input
        label="Registro ANVISA"
        required
        disabled={disabled}
        value={form.numeroRegAnvisa ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, numeroRegAnvisa: event.target.value }))}
      />
      <Input
        label="Preço (R$)"
        type="number"
        step="0.01"
        min="0"
        required
        disabled={disabled}
        value={String(form.preco)}
        onChange={(event) => setForm((atual) => ({ ...atual, preco: Number(event.target.value) }))}
      />
      <Select
        label="Classificação"
        options={classificacaoOptions}
        value={form.classificacao ?? "LIVRE"}
        disabled={disabled}
        onChange={(valor) => setForm((atual) => ({ ...atual, classificacao: valor as Classificacao }))}
      />
      <DateInput
        label="Data de fabricação"
        required
        disabled={disabled}
        value={form.dataFabricacao ?? ""}
        onChange={(iso) => setForm((atual) => ({ ...atual, dataFabricacao: iso }))}
      />
      <DateInput
        label="Validade"
        required
        disabled={disabled}
        value={form.validade ?? ""}
        onChange={(iso) => setForm((atual) => ({ ...atual, validade: iso }))}
      />
      <Input
        label="Quantidade em estoque"
        type="number"
        min="0"
        disabled={disabled}
        value={String(form.quantidadeEstoque ?? 0)}
        onChange={(event) =>
          setForm((atual) => ({ ...atual, quantidadeEstoque: Number(event.target.value) }))
        }
      />
      <Input
        label="Quantidade máxima por venda"
        type="number"
        min="0"
        disabled={disabled}
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
        disabled={disabled}
        value={form.concentracao ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, concentracao: event.target.value }))}
      />
      <Input
        label="Forma farmacêutica"
        disabled={disabled}
        value={form.formaFarmaceutica ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, formaFarmaceutica: event.target.value }))}
      />
      <Input
        label="Tarja"
        disabled={disabled}
        value={form.tarja ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, tarja: event.target.value }))}
      />
      <Input
        label="Classe de controle"
        disabled={disabled}
        value={form.classeControle ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, classeControle: event.target.value }))}
      />
      <Input
        label="Lote"
        disabled={disabled}
        value={form.lote ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, lote: event.target.value }))}
      />
      <Input
        label="Local no estoque"
        disabled={disabled}
        value={form.localEstoque ?? ""}
        onChange={(event) => setForm((atual) => ({ ...atual, localEstoque: event.target.value }))}
      />
      <Input
        label="Validade da receita (dias)"
        type="number"
        min="0"
        disabled={disabled}
        value={form.validadeReceita == null ? "" : String(form.validadeReceita)}
        onChange={(event) =>
          setForm((atual) => ({
            ...atual,
            validadeReceita: event.target.value === "" ? null : Number(event.target.value),
          }))
        }
      />

      <div className="flex flex-wrap items-end gap-5 rounded-2xl bg-surface-muted px-4 py-3 sm:col-span-2 lg:col-span-3">
        <Checkbox
          label="Exige retenção de receita"
          disabled={disabled}
          checked={Boolean(form.retencaoReceita)}
          onChange={(event) =>
            setForm((atual) => ({ ...atual, retencaoReceita: event.target.checked }))
          }
        />
        <Checkbox
          label="Genérico"
          disabled={disabled}
          checked={Boolean(form.generico)}
          onChange={(event) => setForm((atual) => ({ ...atual, generico: event.target.checked }))}
        />
        {mostrarStatus ? (
          <Checkbox
            label="Produto ativo"
            disabled={disabled}
            checked={Boolean(form.isActive)}
            onChange={(event) => setForm((atual) => ({ ...atual, isActive: event.target.checked }))}
          />
        ) : null}
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Textarea
          label="Descrição"
          disabled={disabled}
          value={form.descricao ?? ""}
          onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))}
        />
      </div>
    </div>
  );
}

/** A tela serve três rotas; o modo decide a fonte de dados e o texto de apoio. */
type ModoLista = "catalogo" | "entrada" | "validades";

function modoDaRota(pathname: string): ModoLista {
  if (pathname.endsWith("/validades")) return "validades";
  if (pathname.endsWith("/entrada")) return "entrada";
  return "catalogo";
}

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

  const [acaoEntrada, setAcaoEntrada] = useState<ProdutoDTO | null>(null);
  const [valorAcao, setValorAcao] = useState("");
  const [detalhe, setDetalhe] = useState<ProdutoDTO | null>(null);

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

  function abrirEntrada(produto: ProdutoDTO) {
    setAcaoEntrada(produto);
    setValorAcao("");
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
      const resultado = produto.isActive
        ? await service.bloquear(produto.id)
        : await service.desbloquear(produto.id);
      setSuccess(resultado.message);
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onAcaoSubmit(event: FormEvent) {
    event.preventDefault();
    if (!acaoEntrada) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const resultado = await service.entrada(acaoEntrada.id, Number(valorAcao));
      setSuccess(resultado.message);
      setAcaoEntrada(null);
      setValorAcao("");
      await load(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {modo !== "validades" || gerenciaProdutos ? (
        <BarraListagem
          mostrarBusca={modo !== "validades"}
          placeholder="Buscar por nome, código de barras, princípio ativo..."
          busca={busca}
          onBuscaChange={setBusca}
          onBuscar={() => void load(busca)}
          acao={
            gerenciaProdutos ? (
              <Button type="button" onClick={openCreate}>
                <IconPlus size={16} /> Novo produto
              </Button>
            ) : undefined
          }
        />
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
            {
              key: "acoes",
              header: "Ações",
              fim: true,
              className: "min-w-40",
              render: (produto: ProdutoDTO) => (
                <RowActions>
                  <IconButton label="Detalhes do produto" onClick={() => setDetalhe(produto)}>
                    <IconEye size={17} />
                  </IconButton>
                  {gerenciaProdutos ? (
                    <IconButton label="Editar produto" onClick={() => openEdit(produto)}>
                      <IconPencil size={17} />
                    </IconButton>
                  ) : null}
                  {daEntrada ? (
                    <IconButton
                      label="Entrada de estoque"
                      tone="success"
                      onClick={() => abrirEntrada(produto)}
                    >
                      <IconArrowDown size={17} />
                    </IconButton>
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
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar produto" : "Novo produto"}
        tamanho="lg"
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
        <form id="produto-form" onSubmit={onSubmit}>
          <FormularioProduto form={form} setForm={setForm} />
        </form>
      </Modal>

      <Modal
        open={detalhe !== null}
        title={detalhe ? `Detalhes · ${detalhe.nome}` : "Detalhes do produto"}
        tamanho="xl"
        onClose={() => setDetalhe(null)}
        footer={
          <Button type="button" variant="secondary" onClick={() => setDetalhe(null)}>
            Fechar
          </Button>
        }
      >
        {detalhe ? (
          <div className="space-y-3">
            <Input label="ID" disabled value={String(detalhe.id)} readOnly />
            <FormularioProduto
              form={produtoParaInput(detalhe)}
              setForm={() => undefined}
              disabled
              mostrarStatus
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={acaoEntrada !== null}
        title={acaoEntrada ? `Entrada de estoque · ${acaoEntrada.nome}` : "Entrada de estoque"}
        onClose={() => setAcaoEntrada(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setAcaoEntrada(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="acao-estoque-form" variant="success" disabled={saving}>
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <form id="acao-estoque-form" className="space-y-3" onSubmit={onAcaoSubmit}>
          {acaoEntrada ? (
            <p className="text-sm text-ink-muted">
              Estoque atual:{" "}
              <strong className="text-ink">{acaoEntrada.quantidadeEstoque}</strong> unidades
              · validade atual:{" "}
              <strong className="text-ink">{formatarData(acaoEntrada.validade)}</strong>
            </p>
          ) : null}

          <Input
            label="Quantidade a adicionar"
            type="number"
            min="1"
            step="1"
            required
            value={valorAcao}
            onChange={(event) => setValorAcao(event.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
