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
import { data as formatarData, diasAte, paraInputDate } from "../../../shared/ui/format";
import { Checkbox, Input, Textarea } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { DateInput } from "../../../shared/ui/DateInput";
import { Modal } from "../../../shared/ui/Modal";
import { pedirConfirmacao, toastErro, toastSucesso } from "../../../shared/ui/feedback";
import { Alert, EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import {
  IconArrowDown,
  IconCalendar,
  IconLock,
  IconPencil,
  IconPills,
  IconPlus,
  IconSquare,
  IconSquareCheck,
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

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function validarDatasProduto(form: ProdutoInput): { fabricacao?: string; validade?: string } {
  const erros: { fabricacao?: string; validade?: string } = {};
  const hoje = hojeISO();

  if (form.dataFabricacao && form.validade && form.dataFabricacao > form.validade) {
    erros.fabricacao = "A data de fabricação não pode ser posterior à data de validade.";
    erros.validade = "A data de validade deve ser posterior à data de fabricação.";
  }

  if (form.validade && form.validade <= hoje) {
    erros.validade = "A data de validade deve ser maior que a data atual.";
  }

  return erros;
}

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
  const errosDatas = validarDatasProduto(form);

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
        error={errosDatas.fabricacao}
        onChange={(iso) => setForm((atual) => ({ ...atual, dataFabricacao: iso }))}
      />
      <DateInput
        label="Validade"
        required
        disabled={disabled}
        value={form.validade ?? ""}
        error={errosDatas.validade}
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
          <Button
            type="button"
            variant={form.isActive ? "success" : "secondary"}
            className="min-w-32"
            disabled={disabled}
            onClick={() => setForm((atual) => ({ ...atual, isActive: !atual.isActive }))}
          >
            {form.isActive ? "Ativo" : "Inativo"}
          </Button>
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

/** A tela serve catálogo e controle de validades; entrada de estoque é só modal. */
type ModoLista = "catalogo" | "validades";

function modoDaRota(pathname: string): ModoLista {
  if (pathname.endsWith("/validades")) return "validades";
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
      : catalogoCompleto
        ? "Todos os Produtos"
        : "Consultar Produtos";
  usePageTitle(titulo);

  const service = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);

  const [busca, setBusca] = useState(params.get("q") ?? "");
  const [rows, setRows] = useState<ProdutoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProdutoDTO | null>(null);
  const [form, setForm] = useState<ProdutoInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [acaoEntrada, setAcaoEntrada] = useState<ProdutoDTO | null>(null);
  const [acaoValidade, setAcaoValidade] = useState<ProdutoDTO | null>(null);
  const [valorAcao, setValorAcao] = useState("");
  const [novaValidade, setNovaValidade] = useState("");
  const [detalhe, setDetalhe] = useState<ProdutoDTO | null>(null);

  const load = useCallback(
    async (termo: string) => {
      setLoading(true);
      try {
        const lista =
          modo === "validades"
            ? await service.listarValidades()
            : await service.listarPorPerfil(catalogoCompleto, termo);
        setRows(lista);
      } catch (err) {
        toastErro(getErrorMessage(err));
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
  }

  function abrirValidade(produto: ProdutoDTO) {
    setAcaoValidade(produto);
    setNovaValidade(paraInputDate(produto.validade));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const errosDatas = validarDatasProduto(form);
    if (errosDatas.fabricacao || errosDatas.validade) {
      toastErro(errosDatas.validade ?? errosDatas.fabricacao ?? "Datas do produto inválidas.");
      return;
    }

    setSaving(true);
    try {
      const resultado = editing
        ? await service.editar(editing.id, form)
        : await service.cadastrar(form);
      toastSucesso(resultado.message);
      setModalOpen(false);
      await load(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(produto: ProdutoDTO) {
    setDetalhe(null);
    try {
      const confirmou = await pedirConfirmacao({
        titulo: "Excluir produto?",
        texto: `O produto “${produto.nome}” será removido do catálogo. Esta ação não pode ser desfeita.`,
        confirmar: "Excluir",
      });
      if (!confirmou) return;
      await service.deletar(produto.id);
      setRows((listaAtual) => listaAtual.filter((item) => item.id !== produto.id));
      setDetalhe((atual) => (atual && atual.id === produto.id ? null : atual));
      toastSucesso("Produto removido.");
      await load(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    }
  }

  async function onBloquear(produto: ProdutoDTO) {
    try {
      const resultado = produto.isActive
        ? await service.bloquear(produto.id)
        : await service.desbloquear(produto.id);
      toastSucesso(resultado.message);
      await load(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    }
  }

  async function onAcaoSubmit(event: FormEvent) {
    event.preventDefault();
    if (!acaoEntrada) return;

    setSaving(true);
    try {
      const resultado = await service.entrada(acaoEntrada.id, Number(valorAcao));
      toastSucesso(resultado.message);
      setAcaoEntrada(null);
      setValorAcao("");
      await load(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onValidadeSubmit(event: FormEvent) {
    event.preventDefault();
    if (!acaoValidade) return;

    if (!novaValidade) {
      toastErro("Informe a nova data de validade.");
      return;
    }

    const hoje = hojeISO();
    if (novaValidade <= hoje) {
      toastErro("A data de validade deve ser maior que a data atual.");
      return;
    }

    const dataFabricacao = acaoValidade.dataFabricacao ?? "";
    if (dataFabricacao && novaValidade <= dataFabricacao) {
      toastErro("A nova validade deve ser posterior à data de fabricação.");
      return;
    }

    setSaving(true);
    try {
      const resultado = await service.alterarValidade(acaoValidade.id, novaValidade);
      toastSucesso(resultado.message);
      setAcaoValidade(null);
      setNovaValidade("");
      await load(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
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

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(produto) => produto.id}
          onRowClick={setDetalhe}
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
            {
              key: "id",
              header: "ID",
              largura: "2.75rem",
              render: (produto) => produto.id,
            },
            {
              key: "nome",
              header: "Produto",
              render: (produto) => (
                <div className="min-w-0">
                  <p className="truncate font-semibold">{produto.nome}</p>
                  <p className="truncate text-xs text-ink-muted">{produto.codigoBarras}</p>
                </div>
              ),
            },
            {
              key: "classificacao",
              header: "Classificação",
              largura: "7.5rem",
              render: (produto) => (
                <Badge tone={classificacaoTone(produto.classificacao)}>
                  {classificacaoLabel[produto.classificacao]}
                </Badge>
              ),
            },
            {
              key: "estoque",
              header: "Estoque",
              largura: "4.5rem",
              render: (produto) => (
                <span
                  className={`tabular-nums ${
                    produto.quantidadeEstoque <= 5 ? "font-semibold text-brand-red" : ""
                  }`}
                >
                  {produto.quantidadeEstoque}
                </span>
              ),
            },
            {
              key: "validade",
              header: "Validade",
              largura: "6.75rem",
              render: (produto) => {
                const dias = diasAte(produto.validade);
                const critico = dias !== null && dias <= 30;
                return (
                  <span
                    className={`whitespace-nowrap tabular-nums ${
                      critico ? "font-semibold text-brand-red" : "text-ink"
                    }`}
                  >
                    {formatarData(produto.validade)}
                  </span>
                );
              },
            },
            {
              key: "ativo",
              header: "",
              largura: "2.5rem",
              className: "text-center",
              render: (produto) =>
                produto.isActive ? (
                  <span className="inline-flex text-brand-green" aria-label="Ativo">
                    <IconSquareCheck size={18} />
                  </span>
                ) : (
                  <span className="inline-flex text-ink-muted" aria-label="Bloqueado">
                    <IconSquare size={18} />
                  </span>
                ),
            },
            {
              key: "acoes",
              header: "Ações",
              fim: true,
              largura: "9.5rem",
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
                      onClick={() => abrirEntrada(produto)}
                    >
                      <IconArrowDown size={17} />
                    </IconButton>
                  ) : null}
                  {controlaValidade ? (
                    <IconButton
                      label="Alterar validade"
                      tone="success"
                      onClick={() => abrirValidade(produto)}
                    >
                      <IconCalendar size={17} />
                    </IconButton>
                  ) : null}
                  {controlaValidade ? (
                    <IconButton
                      label={produto.isActive ? "Bloquear produto" : "Desbloquear produto"}
                      tone={produto.isActive ? "warning" : "success"}
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

      <Modal
        open={acaoValidade !== null}
        title={acaoValidade ? `Alterar validade · ${acaoValidade.nome}` : "Alterar validade"}
        onClose={() => setAcaoValidade(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setAcaoValidade(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="acao-validade-form" disabled={saving}>
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <form id="acao-validade-form" className="space-y-3" onSubmit={onValidadeSubmit}>
          {acaoValidade ? (
            <p className="text-sm text-ink-muted">
              Validade atual:{" "}
              <strong className="text-ink">{formatarData(acaoValidade.validade)}</strong>
            </p>
          ) : null}

          <DateInput
            label="Nova validade"
            required
            value={novaValidade}
            onChange={setNovaValidade}
          />
        </form>
      </Modal>
    </div>
  );
}
