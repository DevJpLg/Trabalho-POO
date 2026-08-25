import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  statusVendaLabel,
  type ItemVendaDTO,
  type ProdutoDTO,
  type StatusVenda,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button, IconButton } from "../../../shared/ui/Button";
import { Card, CardHeader } from "../../../shared/ui/Card";
import { dataHora, moeda } from "../../../shared/ui/format";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { Modal } from "../../../shared/ui/Modal";
import { pedirConfirmacao, toastErro, toastSucesso } from "../../../shared/ui/feedback";
import { Alert, EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { IconHash, IconInbox, IconRefresh, IconTrash } from "../../../shared/ui/icons";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { VendaRepository } from "../../venda/venda.repository";
import { VendaService } from "../../venda/venda.service";
import { ItemVendaRepository } from "../itemVenda.repository";
import { ItemVendaService } from "../itemVenda.service";

/**
 * Tela de atendimento (ATENDENTE) e de caixa (CAIXA).
 *
 * A venda não é digitada à mão: o seletor é alimentado por `GET /vendas`, única
 * rota implementada do módulo Venda. Iniciar, finalizar e cancelar venda ainda
 * respondem 501 no backend, então não aparecem aqui (ver ERROS_BACKEND.md).
 */

const STATUS_ATENDIMENTO: StatusVenda[] = ["EM_ANDAMENTO", "EM_AVALIACAO", "AGUARDANDO_PAGAMENTO"];

function statusTone(status: StatusVenda) {
  if (status === "EM_AVALIACAO") return "amber" as const;
  if (status === "CANCELADA") return "red" as const;
  if (status === "FINALIZADA") return "neutral" as const;
  return "green" as const;
}

export function ItensVendaPage() {
  const { http, usuario } = useAuth();
  const ehCaixa = usuario?.perfil === "CAIXA";
  usePageTitle(ehCaixa ? "Caixa" : "Atendimento");

  const itens = useMemo(() => new ItemVendaService(new ItemVendaRepository(http)), [http]);
  const vendas = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const produtos = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);

  const [statusFiltro, setStatusFiltro] = useState<StatusVenda | "TODAS">(
    ehCaixa ? "AGUARDANDO_PAGAMENTO" : "EM_ANDAMENTO",
  );
  const [listaVendas, setListaVendas] = useState<VendaDTO[]>([]);
  const [vendaId, setVendaId] = useState<number | null>(null);

  const [linhas, setLinhas] = useState<ItemVendaDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [catalogo, setCatalogo] = useState<ProdutoDTO[]>([]);
  /** Acumula todo produto já visto, para o nome não sumir quando a busca filtra o catálogo. */
  const [indiceProdutos, setIndiceProdutos] = useState<Map<number, ProdutoDTO>>(new Map());

  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [carregandoItens, setCarregandoItens] = useState(false);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoDTO | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [salvando, setSalvando] = useState(false);

  const [itemEditando, setItemEditando] = useState<ItemVendaDTO | null>(null);
  const [novaQuantidade, setNovaQuantidade] = useState("1");

  const vendaSelecionada = listaVendas.find((venda) => venda.id === vendaId) ?? null;

  /* ========== Carregamento das vendas disponíveis ========== */

  const carregarVendas = useCallback(async () => {
    setCarregandoVendas(true);
    try {
      const lista = await vendas.listar(statusFiltro === "TODAS" ? undefined : statusFiltro);
      setListaVendas(lista);
      setVendaId((atual) => {
        if (atual !== null && lista.some((venda) => venda.id === atual)) return atual;
        return lista[0]?.id ?? null;
      });
    } catch (err) {
      toastErro(getErrorMessage(err));
      setListaVendas([]);
      setVendaId(null);
    } finally {
      setCarregandoVendas(false);
    }
  }, [vendas, statusFiltro]);

  useEffect(() => {
    void carregarVendas();
  }, [carregarVendas]);

  /* ========== Catálogo, para exibir nome do produto e alimentar o seletor ========== */

  const carregarCatalogo = useCallback(
    async (termo = "") => {
      try {
        const lista = await produtos.buscarVendaveis(termo);
        setCatalogo(lista);
        setIndiceProdutos((atual) => {
          const proximo = new Map(atual);
          lista.forEach((produto) => proximo.set(produto.id, produto));
          return proximo;
        });
      } catch {
        setCatalogo([]);
      }
    },
    [produtos],
  );

  useEffect(() => {
    void carregarCatalogo("");
  }, [carregarCatalogo]);

  /* ========== Itens da venda selecionada ========== */

  const carregarItens = useCallback(
    async (id: number) => {
      setCarregandoItens(true);
      try {
        const resumo = await itens.carregarResumo(id);
        setLinhas(resumo.itens);
        setTotal(resumo.total);
      } catch (err) {
        toastErro(getErrorMessage(err));
        setLinhas([]);
        setTotal(0);
      } finally {
        setCarregandoItens(false);
      }
    },
    [itens],
  );

  useEffect(() => {
    if (vendaId === null) {
      setLinhas([]);
      setTotal(0);
      return;
    }
    void carregarItens(vendaId);
  }, [vendaId, carregarItens]);

  /* ========== Ações ========== */

  async function onAdicionar(event: FormEvent) {
    event.preventDefault();
    if (vendaId === null || !produtoSelecionado) return;

    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toastErro("A quantidade precisa ser um inteiro maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await itens.adicionar(vendaId, produtoSelecionado.id, qtd);
      toastSucesso(resultado.message);
      setProdutoSelecionado(null);
      setQuantidade("1");
      await carregarItens(vendaId);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  async function onAtualizarQuantidade(event: FormEvent) {
    event.preventDefault();
    if (vendaId === null || !itemEditando) return;

    const qtd = Number(novaQuantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toastErro("A quantidade precisa ser um inteiro maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await itens.atualizarQuantidade(vendaId, itemEditando.id, qtd);
      toastSucesso(resultado.message);
      setItemEditando(null);
      await carregarItens(vendaId);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  async function onRemover(item: ItemVendaDTO) {
    if (vendaId === null) return;
    const confirmou = await pedirConfirmacao({
      titulo: "Remover item?",
      texto: `O item #${item.id} será retirado desta venda. Esta ação não pode ser desfeita.`,
      confirmar: "Remover",
    });
    if (!confirmou) return;

    try {
      await itens.remover(vendaId, item.id);
      toastSucesso("Item removido da venda.");
      await carregarItens(vendaId);
    } catch (err) {
      toastErro(getErrorMessage(err));
    }
  }

  /* ========== Derivados ========== */

  const nomeProduto = (produtoId: number): string =>
    indiceProdutos.get(produtoId)?.nome ?? `Produto #${produtoId}`;

  const resultadosBusca = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    const base = termo === "" ? catalogo : catalogo.filter((produto) => combina(produto, termo));
    return base.slice(0, 6);
  }, [catalogo, buscaProduto]);

  const podeAlterarItens = vendaSelecionada?.status === "EM_ANDAMENTO";

  const opcoesVenda = listaVendas.map((venda) => ({
    value: String(venda.id ?? ""),
    label: `Venda #${venda.id}`,
    detalhe: `${dataHora(venda.dataHora)} · ${statusVendaLabel[venda.status]}`,
  }));

  return (
    <div>
      <BarraListagem
        mostrarBusca={false}
        acao={
          <Button type="button" variant="secondary" onClick={() => void carregarVendas()}>
            <IconRefresh size={16} /> Atualizar
          </Button>
        }
      />

      <Card className="mb-4">
        <CardHeader titulo="Vendas" descricao="Escolha a venda que você vai atender." />

        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["TODAS", ...STATUS_ATENDIMENTO] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFiltro === status ? "success" : "ghost"}
              onClick={() => setStatusFiltro(status)}
            >
              {status === "TODAS" ? "Todas" : statusVendaLabel[status]}
            </Button>
          ))}
        </div>

        {carregandoVendas ? (
          <p className="text-sm text-ink-muted">Carregando vendas...</p>
        ) : listaVendas.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nenhuma venda com esse status. Como o backend ainda não implementa a abertura de vendas
            (<code>POST /api/vendas</code>), elas precisam existir no banco para aparecer aqui.
          </p>
        ) : (
          <Select
            label="Venda em atendimento"
            options={opcoesVenda}
            value={vendaId != null ? String(vendaId) : ""}
            onChange={(valor) => setVendaId(Number(valor))}
          />
        )}
      </Card>

      {vendaSelecionada ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[25px] bg-surface px-5 py-4 shadow-card ring-1 ring-line/60">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-brand-green">Venda #{vendaSelecionada.id}</p>
            <Badge tone={statusTone(vendaSelecionada.status)}>
              {statusVendaLabel[vendaSelecionada.status]}
            </Badge>
            <span className="text-sm text-ink-muted">{dataHora(vendaSelecionada.dataHora)}</span>
          </div>
          <p className="text-sm font-semibold text-brand-red">Total {moeda(total)}</p>
        </div>
      ) : null}

      {vendaId !== null && podeAlterarItens ? (
        <Card className="mb-4">
          <CardHeader titulo="Adicionar produto" descricao="Só aparecem itens vendáveis: ativos, na validade e com estoque." />

          <BarraListagem
            placeholder="Buscar produto por nome, princípio ativo ou código..."
            busca={buscaProduto}
            onBuscaChange={setBuscaProduto}
            onBuscar={() => void carregarCatalogo(buscaProduto)}
          />

          {resultadosBusca.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nenhum produto vendável encontrado para esse termo.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {resultadosBusca.map((produto) => {
                const ativo = produtoSelecionado?.id === produto.id;
                return (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => setProdutoSelecionado(produto)}
                    className={`rounded-2xl px-4 py-3 text-left transition ${
                      ativo
                        ? "bg-brand-green-soft ring-2 ring-brand-green/40"
                        : "bg-canvas hover:bg-brand-green-soft"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-ink">{produto.nome}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {moeda(produto.preco)} · {produto.quantidadeEstoque} un. ·{" "}
                      {produto.classificacao}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onAdicionar}>
            <div className="sm:w-40">
              <Input
                label="Quantidade"
                type="number"
                min="1"
                step="1"
                required
                value={quantidade}
                onChange={(event) => setQuantidade(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={!produtoSelecionado || salvando}>
              {salvando
                ? "Adicionando..."
                : produtoSelecionado
                  ? `Adicionar ${produtoSelecionado.nome}`
                  : "Selecione um produto"}
            </Button>
          </form>
        </Card>
      ) : null}

      {vendaSelecionada && !podeAlterarItens ? (
        <div className="mb-4">
          <Alert tone="info">
            Esta venda está em “{statusVendaLabel[vendaSelecionada.status]}”: os itens ficam somente
            para consulta.
          </Alert>
        </div>
      ) : null}

      {carregandoItens ? (
        <LoadingState label="Carregando itens da venda..." />
      ) : (
        <Table
          rows={linhas}
          rowKey={(item) => item.id}
          empty={
            <EmptyState
              icone={<IconInbox size={22} />}
              titulo={vendaId === null ? "Nenhuma venda selecionada" : "Venda sem itens"}
              descricao={
                vendaId === null
                  ? "Escolha uma venda no seletor acima para ver e montar a cesta."
                  : podeAlterarItens
                    ? "Busque um produto acima e adicione o primeiro item desta venda."
                    : "Esta venda não tem itens registrados."
              }
            />
          }
          footer={linhas.length > 0 ? `Total da venda: ${moeda(total)}` : undefined}
          columns={[
            { key: "id", header: "ID", render: (item) => item.id },
            {
              key: "produto",
              header: "Produto",
              render: (item) => {
                const produto = indiceProdutos.get(item.produtoId);
                return (
                  <div>
                    <p className="font-semibold">{nomeProduto(item.produtoId)}</p>
                    <p className="text-xs text-ink-muted">
                      {produto ? produto.codigoBarras : `Produto #${item.produtoId}`}
                    </p>
                  </div>
                );
              },
            },
            { key: "qtd", header: "Qtd", render: (item) => item.quantidade },
            { key: "unit", header: "Unitário", render: (item) => moeda(item.precoUnitario) },
            { key: "sub", header: "Subtotal", render: (item) => moeda(item.precoSubtotal) },
            {
              key: "aval",
              header: "Avaliação",
              render: (item) =>
                item.exigeAvaliacao ? (
                  <Badge tone={item.aprovadoFarmaceutico ? "green" : "amber"}>
                    {item.aprovadoFarmaceutico ? "Aprovado" : "Pendente"}
                  </Badge>
                ) : (
                  <Badge>Livre</Badge>
                ),
            },
            ...(podeAlterarItens
              ? [
                  {
                    key: "acoes",
                    header: "Ações",
                    fim: true,
                    render: (item: ItemVendaDTO) => (
                      <RowActions>
                        <IconButton
                          label="Alterar quantidade"
                          onClick={() => {
                            setItemEditando(item);
                            setNovaQuantidade(String(item.quantidade));
                          }}
                        >
                          <IconHash size={17} />
                        </IconButton>
                        <IconButton
                          label="Remover item"
                          tone="danger"
                          onClick={() => void onRemover(item)}
                        >
                          <IconTrash size={17} />
                        </IconButton>
                      </RowActions>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}

      <Modal
        open={itemEditando !== null}
        title={itemEditando ? `Quantidade · item #${itemEditando.id}` : "Quantidade"}
        onClose={() => setItemEditando(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setItemEditando(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="quantidade-form" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="quantidade-form" className="space-y-3" onSubmit={onAtualizarQuantidade}>
          {itemEditando ? (
            <p className="text-sm text-ink-muted">
              {nomeProduto(itemEditando.produtoId)} · unitário {moeda(itemEditando.precoUnitario)}
            </p>
          ) : null}
          <Input
            label="Nova quantidade"
            type="number"
            min="1"
            step="1"
            required
            value={novaQuantidade}
            onChange={(event) => setNovaQuantidade(event.target.value)}
          />
          <p className="text-xs text-ink-muted">
            Item controlado que já estava aprovado volta para “pendente” após a alteração.
          </p>
        </form>
      </Modal>
    </div>
  );
}

function combina(produto: ProdutoDTO, termo: string): boolean {
  return [produto.nome, produto.principioAtivo, produto.codigoBarras, produto.categoria]
    .join(" ")
    .toLowerCase()
    .includes(termo);
}
