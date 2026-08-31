import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  classificacaoLabel,
  type ItemVendaDTO,
  type PrescricaoDTO,
  type ProdutoDTO,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Card, SectionTitle } from "../../../shared/ui/Card";
import { data as formatarData, dataHora, diasAte, moeda } from "../../../shared/ui/format";
import { pedirConfirmacao, toastErro, toastInfo, toastSucesso } from "../../../shared/ui/feedback";
import { Alert, EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { IconBell, IconCheck, IconClose, IconFile, IconSend } from "../../../shared/ui/icons";
import { ModalVisualizarPdfPrescricao } from "../../prescricao/ModalVisualizarPdfPrescricao";
import { ItemVendaRepository } from "../../itemVenda/itemVenda.repository";
import { ItemVendaService } from "../../itemVenda/itemVenda.service";
import { PrescricaoRepository } from "../../prescricao/prescricao.repository";
import { PrescricaoService } from "../../prescricao/prescricao.service";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { VendaRepository } from "../venda.repository";
import { VendaService } from "../venda.service";
import { NotificacaoRepository } from "../../notificacao/notificacao.repository";
import { NotificacaoService } from "../../notificacao/notificacao.service";

type DetalheVenda = {
  itens: ItemVendaDTO[];
  receitas: PrescricaoDTO[];
  total: number;
};

type DecisaoItem = "aprovar" | "recusar";

type BotaoIconeProps = {
  label: string;
  tone: "success" | "danger";
  ativo?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function BotaoIcone({
  label,
  tone,
  ativo = false,
  disabled,
  onClick,
  children,
}: BotaoIconeProps) {
  const contorno =
    tone === "success"
      ? "bg-surface text-brand-green ring-1 ring-brand-green/30 hover:bg-brand-green-soft"
      : "bg-surface text-brand-red ring-1 ring-brand-red/30 hover:bg-brand-red-soft";
  const marcado =
    tone === "success"
      ? "bg-surface text-brand-green ring-2 ring-brand-green"
      : "bg-surface text-brand-red ring-2 ring-brand-red";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={ativo}
      disabled={disabled}
      className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${
        ativo ? marcado : contorno
      }`}
      onClick={(evento) => {
        evento.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export function AvaliacoesPage() {
  usePageTitle("Avaliação");
  const navigate = useNavigate();
  const { http } = useAuth();
  const [searchParams] = useSearchParams();

  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const itensApi = useMemo(() => new ItemVendaService(new ItemVendaRepository(http)), [http]);
  const prescricoesApi = useMemo(
    () => new PrescricaoService(new PrescricaoRepository(http)),
    [http],
  );
  const produtosApi = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);
  const notificacoesApi = useMemo(
    () => new NotificacaoService(new NotificacaoRepository(http)),
    [http],
  );

  const vendaParam = Number(searchParams.get("venda"));
  const vendaSelecionadaId =
    Number.isInteger(vendaParam) && vendaParam > 0 ? vendaParam : null;

  const [vendaAtual, setVendaAtual] = useState<VendaDTO | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheVenda | null>(null);
  const [produtos, setProdutos] = useState<Map<number, ProdutoDTO>>(new Map());
  const [decisoes, setDecisoes] = useState<Record<number, DecisaoItem>>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [receitaPdf, setReceitaPdf] = useState<PrescricaoDTO | null>(null);

  const carregar = useCallback(
    async (vendaId: number) => {
      setLoading(true);
      try {
        const [venda, resumo, receitas, catalogo] = await Promise.all([
          vendasApi.localizar(vendaId),
          itensApi.carregarResumo(vendaId),
          prescricoesApi.listarPorVenda(vendaId),
          produtosApi.listar(""),
        ]);

        const indice = new Map<number, ProdutoDTO>();
        catalogo.forEach((produto) => indice.set(produto.id, produto));

        const iniciais: Record<number, DecisaoItem> = {};
        resumo.itens.forEach((item) => {
          if (item.exigeAvaliacao && item.aprovadoFarmaceutico) {
            iniciais[item.id] = "aprovar";
          }
        });

        setProdutos(indice);
        setVendaAtual(venda);
        setDetalhe({
          itens: resumo.itens,
          receitas,
          total: resumo.total,
        });
        setDecisoes(iniciais);
      } catch (err) {
        toastErro(getErrorMessage(err));
        setVendaAtual(null);
        setDetalhe(null);
        setDecisoes({});
      } finally {
        setLoading(false);
      }
    },
    [itensApi, prescricoesApi, produtosApi, vendasApi],
  );

  useEffect(() => {
    if (vendaSelecionadaId == null) {
      setVendaAtual(null);
      setDetalhe(null);
      setDecisoes({});
      return;
    }
    void carregar(vendaSelecionadaId);
  }, [vendaSelecionadaId, carregar]);

  const itensAvaliacao = detalhe?.itens.filter((item) => item.exigeAvaliacao) ?? [];
  const quantidadeRecusas = itensAvaliacao.filter((item) => decisoes[item.id] === "recusar").length;
  const todosAprovados =
    itensAvaliacao.length > 0 &&
    itensAvaliacao.every((item) => decisoes[item.id] === "aprovar");
  const podeFinalizar = todosAprovados && quantidadeRecusas === 0;

  function nomeProduto(produtoId: number): string {
    return produtos.get(produtoId)?.nome ?? `Produto #${produtoId}`;
  }

  function marcarItem(itemId: number, decisao: DecisaoItem) {
    setDecisoes((atuais) => ({ ...atuais, [itemId]: decisao }));
  }

  function badgeAvaliacao(item: ItemVendaDTO) {
    if (!item.exigeAvaliacao) return <Badge>Livre</Badge>;
    const decisao = decisoes[item.id];
    if (decisao === "aprovar") return <Badge tone="green">Aprovado</Badge>;
    if (decisao === "recusar") return <Badge tone="red">Recusado</Badge>;
    return <Badge tone="amber">Pendente</Badge>;
  }

  async function concluirNotificacao() {
    if (vendaSelecionadaId == null) return;
    try {
      await notificacoesApi.atenderPorVenda(vendaSelecionadaId);
    } catch {
      /* a avaliação já foi gravada; o sino some no próximo ciclo se o atender falhar */
    }
  }

  async function recusarVenda() {
    if (vendaSelecionadaId == null) return;

    const ok = await pedirConfirmacao({
      titulo: "Recusar esta venda?",
      texto:
        quantidadeRecusas > 0
          ? `${quantidadeRecusas} item${quantidadeRecusas === 1 ? "" : "s"} recusado${
              quantidadeRecusas === 1 ? "" : "s"
            }. A venda será cancelada.`
          : "A venda será cancelada e sairá da avaliação.",
      confirmar: "Recusar venda",
      perigo: true,
    });
    if (!ok) return;

    setSalvando(true);
    try {
      const recusados = itensAvaliacao.filter((item) => decisoes[item.id] === "recusar");
      for (const item of recusados) {
        await itensApi.recusarItem(vendaSelecionadaId, item.id);
      }
      await vendasApi.cancelar(vendaSelecionadaId);
      await concluirNotificacao();
      toastInfo("Venda recusada.");
      navigate("/");
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  async function enviarParaPagamento() {
    if (vendaSelecionadaId == null || !podeFinalizar) return;

    const ok = await pedirConfirmacao({
      titulo: "Enviar para pagamento?",
      texto: "Todos os itens controlados foram aprovados. A venda seguirá para o caixa.",
      confirmar: "Enviar para pagamento",
      perigo: false,
    });
    if (!ok) return;

    setSalvando(true);
    try {
      for (const item of itensAvaliacao) {
        if (!item.aprovadoFarmaceutico) {
          await itensApi.aprovarItem(vendaSelecionadaId, item.id);
        }
      }
      await vendasApi.finalizar(vendaSelecionadaId);
      await concluirNotificacao();
      toastSucesso("Venda liberada para pagamento no caixa.");
      navigate("/");
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-w-0">
      {vendaSelecionadaId == null ? (
        <EmptyState
          icone={<IconBell size={22} />}
          titulo="Nenhuma venda selecionada"
          descricao="Abra o sino de notificações no topo para atender uma venda aguardando avaliação."
        />
      ) : loading ? (
        <LoadingState label="Carregando venda..." />
      ) : !detalhe ? (
        <Alert tone="error">Não foi possível carregar os dados desta venda.</Alert>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="mb-0">Venda #{vendaSelecionadaId}</SectionTitle>
              <div className="flex flex-row items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={salvando || quantidadeRecusas === 0}
                  onClick={() => void recusarVenda()}
                >
                  <IconClose size={18} />
                  Recusar
                </Button>
                <Button
                  type="button"
                  variant="success"
                  disabled={salvando || !podeFinalizar}
                  onClick={() => void enviarParaPagamento()}
                >
                  <IconSend size={18} />
                  Enviar para pagamento
                </Button>
              </div>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink-muted">Aberta em</dt>
                <dd className="font-medium">{dataHora(vendaAtual?.dataHora)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Itens no cupom</dt>
                <dd className="font-medium">{detalhe.itens.length}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-semibold text-brand-red">{moeda(detalhe.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <SectionTitle>Itens da venda</SectionTitle>
            <Table
              rows={detalhe.itens}
              rowKey={(item) => item.id}
              columns={[
                {
                  key: "produto",
                  header: "Produto",
                  render: (item) => {
                    const produto = produtos.get(item.produtoId);
                    return (
                      <div>
                        <p className="font-semibold">{nomeProduto(item.produtoId)}</p>
                        {produto ? (
                          <p className="text-xs text-ink-muted">
                            {classificacaoLabel[produto.classificacao]}
                            {produto.quantidadeMaxima != null
                              ? ` · máx. ${produto.quantidadeMaxima}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    );
                  },
                },
                { key: "qtd", header: "Qtd", render: (item) => item.quantidade },
                { key: "sub", header: "Subtotal", render: (item) => moeda(item.precoSubtotal) },
                {
                  key: "aval",
                  header: "Avaliação",
                  render: (item) => badgeAvaliacao(item),
                },
                {
                  key: "acoes",
                  header: "Ações",
                  fim: true,
                  render: (item) =>
                    item.exigeAvaliacao ? (
                      <div className="flex flex-row items-center justify-end gap-2">
                        <BotaoIcone
                          label="Aprovar item"
                          tone="success"
                          ativo={decisoes[item.id] === "aprovar"}
                          disabled={salvando}
                          onClick={() => marcarItem(item.id, "aprovar")}
                        >
                          <IconCheck size={22} />
                        </BotaoIcone>
                        <BotaoIcone
                          label="Recusar item"
                          tone="danger"
                          ativo={decisoes[item.id] === "recusar"}
                          disabled={salvando}
                          onClick={() => marcarItem(item.id, "recusar")}
                        >
                          <IconClose size={22} />
                        </BotaoIcone>
                      </div>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />
          </Card>

          <Card>
            <SectionTitle>Prescrições vinculadas</SectionTitle>
            {detalhe.receitas.length === 0 ? (
              <Alert tone="error">
                Nenhuma prescrição registrada para esta venda. Cadastre a receita antes de
                liberar medicamentos controlados.
              </Alert>
            ) : (
              <ul className="space-y-3">
                {detalhe.receitas.map((receita) => {
                  const dias = diasAte(receita.dataValidade);
                  const vencida = dias !== null && dias < 0;
                  return (
                    <li key={receita.id}>
                      <button
                        type="button"
                        onClick={() => setReceitaPdf(receita)}
                        className="w-full rounded-2xl bg-canvas px-4 py-3 text-left text-sm transition hover:bg-surface-hover hover:ring-1 hover:ring-brand-green/30"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex items-center gap-2 font-semibold text-ink">
                            <IconFile size={17} className="text-brand-green" />
                            Receita {receita.numeroPrescricao}
                          </p>
                          <Badge tone={vencida ? "red" : "green"}>
                            {vencida ? "Vencida" : `Válida até ${formatarData(receita.dataValidade)}`}
                          </Badge>
                        </div>
                        <p className="mt-1 text-ink-muted">
                          {receita.nomePaciente} · {receita.nomeMedico} · CRM {receita.numeroCrm}/
                          {receita.ufCrm}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-green">Clique para ver o PDF</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {receita.retencao ? "Exige retenção" : "Sem retenção"} ·{" "}
                          {receita.retida ? "receita retida" : "receita não retida"}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      <ModalVisualizarPdfPrescricao
        open={receitaPdf != null}
        prescricaoId={receitaPdf?.id ?? null}
        numeroPrescricao={receitaPdf?.numeroPrescricao ?? ""}
        anexo={receitaPdf?.anexo ?? ""}
        http={http}
        onClose={() => setReceitaPdf(null)}
      />
    </div>
  );
}
