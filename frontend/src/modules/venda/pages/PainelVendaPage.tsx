import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { podeReceberPagamentoVenda, vendaAbrivelNoPdv } from "../../../shared/auth/permissoes";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  classificacaoLabel,
  perfilLabel,
  statusVendaLabel,
  type ItemVendaDTO,
  type ProdutoDTO,
  type StatusVenda,
  type VendaDTO,
} from "../../../shared/types/api";
import { pedirConfirmacao, toastErro, toastInfo, toastSucesso } from "../../../shared/ui/feedback";
import { moeda } from "../../../shared/ui/format";
import {
  IconArrowLeft,
  IconCart,
  IconClose,
  IconMinus,
  IconPlus,
  IconRegister,
  IconSearch,
  IconTrash,
} from "../../../shared/ui/icons";
import { ItemVendaRepository } from "../../itemVenda/itemVenda.repository";
import { ItemVendaService } from "../../itemVenda/itemVenda.service";
import { ProdutoRepository } from "../../produto/produto.repository";
import { ProdutoService } from "../../produto/produto.service";
import { VendaRepository } from "../venda.repository";
import { VendaService } from "../venda.service";
import { PrescricaoRepository } from "../../prescricao/prescricao.repository";
import { PrescricaoService } from "../../prescricao/prescricao.service";
import { ModalPrescricoesVenda } from "../../prescricao/ModalPrescricoesVenda";
import { vendaExigePrescricao } from "../../prescricao/prescricaoVenda.utils";

function ehControlado(produto: ProdutoDTO): boolean {
  return produto.classificacao === "CONTROLADO" || produto.classificacao === "PRESCRITO";
}

function combina(produto: ProdutoDTO, termo: string): boolean {
  return [produto.nome, produto.principioAtivo, produto.codigoBarras, produto.categoria]
    .join(" ")
    .toLowerCase()
    .includes(termo);
}

function statusCor(status: StatusVenda): string {
  if (status === "EM_AVALIACAO") return "bg-amber-ink text-white";
  if (status === "AGUARDANDO_PAGAMENTO") return "bg-brand-green text-white";
  if (status === "FINALIZADA") return "bg-white/20 text-white";
  if (status === "CANCELADA") return "bg-brand-red text-white";
  return "bg-white text-ink";
}

function rotuloFinalizar(status: StatusVenda | undefined): string {
  if (status === "AGUARDANDO_PAGAMENTO") return "Receber pagamento";
  return "Finalizar";
}

/**
 * Painel de PDV: tela cheia, fora do layout administrativo.
 * Cria a venda via `POST /vendas` (registrarVenda) e monta o cupom com as
 * rotas já existentes de itens e de produtos vendáveis.
 */
export function PainelVendaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { http, usuario } = useAuth();
  const buscaRef = useRef<HTMLInputElement>(null);

  const ehCaixa = usuario?.perfil === "CAIXA";
  const ehAtendente = usuario?.perfil === "ATENDENTE";
  const podeReceberPagamento = podeReceberPagamentoVenda(usuario?.perfil);

  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const itensApi = useMemo(() => new ItemVendaService(new ItemVendaRepository(http)), [http]);
  const produtosApi = useMemo(() => new ProdutoService(new ProdutoRepository(http)), [http]);
  const prescricoesApi = useMemo(
    () => new PrescricaoService(new PrescricaoRepository(http)),
    [http],
  );

  const [agora, setAgora] = useState(() => new Date());
  const [venda, setVenda] = useState<VendaDTO | null>(null);
  const [modalPrescricoes, setModalPrescricoes] = useState(false);
  const [linhas, setLinhas] = useState<ItemVendaDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [catalogo, setCatalogo] = useState<ProdutoDTO[]>([]);
  const [indiceProdutos, setIndiceProdutos] = useState<Map<number, ProdutoDTO>>(new Map());
  const [busca, setBusca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [ocupado, setOcupado] = useState(false);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
  const linhasRef = useRef<ItemVendaDTO[]>([]);

  useEffect(() => {
    document.title = "PDV · Farmácia Bairro Saúde";
    return () => {
      document.title = "Farmácia Bairro Saúde";
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const carregarCatalogo = useCallback(
    async (termo = "") => {
      setCarregandoCatalogo(true);
      try {
        const lista = await produtosApi.buscarVendaveis(termo);
        setIndiceProdutos((atual) => {
          const proximo = new Map(atual);
          lista.forEach((produto) => proximo.set(produto.id, produto));
          return proximo;
        });
        setCatalogo(
          ehCaixa ? lista.filter((produto) => produto.classificacao === "LIVRE") : lista,
        );
      } catch (err) {
        toastErro(getErrorMessage(err));
        setCatalogo([]);
      } finally {
        setCarregandoCatalogo(false);
      }
    },
    [produtosApi, ehCaixa],
  );

  const carregarResumo = useCallback(
    async (id: number) => {
      try {
        const [resumo, catalogoCompleto] = await Promise.all([
          itensApi.carregarResumo(id),
          produtosApi.buscarVendaveis(""),
        ]);
        setIndiceProdutos((atual) => {
          const proximo = new Map(atual);
          catalogoCompleto.forEach((produto) => proximo.set(produto.id, produto));
          return proximo;
        });
        linhasRef.current = resumo.itens;
        setLinhas(resumo.itens);
        setTotal(resumo.total);
        setPendentes(resumo.pendentes);
      } catch (err) {
        toastErro(getErrorMessage(err));
        linhasRef.current = [];
        setLinhas([]);
        setTotal(0);
        setPendentes(0);
      }
    },
    [itensApi, produtosApi],
  );

  const vendaQuery = searchParams.get("venda");

  useEffect(() => {
    if (!vendaQuery || !usuario) return;

    const id = Number(vendaQuery);
    if (!Number.isInteger(id) || id <= 0) {
      setSearchParams({}, { replace: true });
      return;
    }

    let ativo = true;
    setOcupado(true);

    void (async () => {
      try {
        const encontrada = await vendasApi.localizar(id);
        if (!ativo) return;

        if (!encontrada || !vendaAbrivelNoPdv(usuario.perfil, encontrada.status)) {
          toastErro("Esta venda não pode ser aberta no painel.");
          setSearchParams({}, { replace: true });
          return;
        }

        setVenda(encontrada);
        await carregarResumo(id);
        setSearchParams({}, { replace: true });
        buscaRef.current?.focus();
      } catch (err) {
        if (ativo) {
          toastErro(getErrorMessage(err));
          setSearchParams({}, { replace: true });
        }
      } finally {
        if (ativo) setOcupado(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [vendaQuery, usuario, vendasApi, carregarResumo, setSearchParams]);

  useEffect(() => {
    const termo = busca.trim();
    if (!termo) {
      void carregarCatalogo("");
      return;
    }
    const timer = window.setTimeout(() => {
      void carregarCatalogo(termo);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [busca, carregarCatalogo]);

  const reiniciarPainel = useCallback(() => {
    setVenda(null);
    setModalPrescricoes(false);
    linhasRef.current = [];
    setLinhas([]);
    setTotal(0);
    setPendentes(0);
    setBusca("");
    setQuantidade("1");
    buscaRef.current?.focus();
  }, []);

  const produtosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return catalogo;
    return catalogo.filter((produto) => combina(produto, termo));
  }, [catalogo, busca]);

  const podeAlterar = venda?.status === "EM_ANDAMENTO";
  const podeCancelar =
    Boolean(venda?.id) &&
    (venda.status === "EM_ANDAMENTO" ||
      (venda.status === "AGUARDANDO_PAGAMENTO" && ehCaixa));
  const podeAvancar =
    Boolean(venda) &&
    linhas.length > 0 &&
    (venda?.status === "EM_ANDAMENTO" ||
      (venda?.status === "AGUARDANDO_PAGAMENTO" && podeReceberPagamento));

  function voltar() {
    const estado = window.history.state as { idx?: number } | null;
    if (estado && typeof estado.idx === "number" && estado.idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  function qtdValida(): number | null {
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toastErro("A quantidade precisa ser um inteiro maior que zero.");
      return null;
    }
    return qtd;
  }

  async function garantirVendaAberta(): Promise<VendaDTO | null> {
    if (!usuario) return null;
    if (venda?.status === "EM_ANDAMENTO" && venda.id != null) return venda;

    const criada = await vendasApi.registrarEResolverId(usuario);
    setVenda(criada);
    linhasRef.current = [];
    setLinhas([]);
    setTotal(0);
    setPendentes(0);
    return criada;
  }

  async function onCancelarVenda() {
    if (!venda?.id || !podeCancelar) return;

    const ok = await pedirConfirmacao({
      titulo: "Cancelar esta venda?",
      texto:
        venda.status === "AGUARDANDO_PAGAMENTO"
          ? "A venda aguardando pagamento será cancelada e o painel será reiniciado."
          : "A venda será marcada como cancelada e o painel será reiniciado.",
      confirmar: "Cancelar venda",
    });
    if (!ok) return;

    setOcupado(true);
    try {
      await vendasApi.cancelar(venda.id);
      toastInfo("Venda cancelada.");
      reiniciarPainel();
      navigate("/registrar-venda", { replace: true });
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }

  async function adicionarProduto(produto: ProdutoDTO, qtd?: number) {
    const unidades = qtd ?? qtdValida();
    if (unidades == null) return;

    setOcupado(true);
    try {
      const aberta = await garantirVendaAberta();
      if (!aberta?.id) return;

      setIndiceProdutos((atual) => {
        const proximo = new Map(atual);
        proximo.set(produto.id, produto);
        return proximo;
      });

      const existente = linhasRef.current.find(
        (item) => item.produtoId === produto.id && item.vendaId === aberta.id,
      );
      if (existente) {
        await itensApi.atualizarQuantidade(aberta.id, existente.id, existente.quantidade + unidades);
      } else {
        await itensApi.adicionar(aberta.id, produto.id, unidades);
      }

      await carregarResumo(aberta.id);
      setQuantidade("1");
      setBusca("");
      buscaRef.current?.focus();
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }

  function onBuscaSubmit(event: FormEvent) {
    event.preventDefault();
    const termo = busca.trim().toLowerCase();
    if (!termo) return;
    const exato = produtosVisiveis.find(
      (produto) => produto.codigoBarras.toLowerCase() === termo,
    );
    const alvo = exato ?? produtosVisiveis[0];
    if (!alvo) {
      toastErro("Nenhum produto vendável para esse código ou nome.");
      return;
    }
    void adicionarProduto(alvo);
  }

  function onBuscaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && podeCancelar) {
      event.preventDefault();
      void onCancelarVenda();
    }
  }

  async function alterarQuantidade(item: ItemVendaDTO, proxima: number) {
    if (!venda?.id || !podeAlterar) return;
    if (proxima <= 0) {
      await removerItem(item, false);
      return;
    }

    setOcupado(true);
    try {
      await itensApi.atualizarQuantidade(venda.id, item.id, proxima);
      await carregarResumo(venda.id);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }

  async function removerItem(item: ItemVendaDTO, confirmar = true) {
    if (!venda?.id) return;
    if (confirmar) {
      const ok = await pedirConfirmacao({
        titulo: "Remover item?",
        texto: `${nomeProduto(item.produtoId)} sai do cupom.`,
        confirmar: "Remover",
      });
      if (!ok) return;
    }

    setOcupado(true);
    try {
      await itensApi.remover(venda.id, item.id);
      await carregarResumo(venda.id);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }

  async function executarFinalizacao() {
    if (!venda?.id || !podeAvancar) return;

    if (venda.status === "AGUARDANDO_PAGAMENTO" && !podeReceberPagamento) {
      toastErro("Somente o caixa pode receber o pagamento.");
      return;
    }

    const titulo =
      venda.status === "AGUARDANDO_PAGAMENTO" ? "Receber pagamento?" : "Finalizar esta venda?";
    const ok = await pedirConfirmacao({
      titulo,
      texto:
        venda.status === "AGUARDANDO_PAGAMENTO"
          ? `Confirma o recebimento de ${moeda(total)}.`
          : pendentes > 0
            ? "Há itens controlados: a venda segue para o farmacêutico."
            : `Total ${moeda(total)}. A venda avança no fluxo.`,
      confirmar: rotuloFinalizar(venda.status),
      perigo: false,
    });
    if (!ok) return;

    const statusAntes = venda.status;
    const idVendaEncerrada = venda.id;
    const vaiParaAvaliacao = statusAntes === "EM_ANDAMENTO" && pendentes > 0;
    const recebeuPagamento = statusAntes === "AGUARDANDO_PAGAMENTO";
    const atendenteLiberouParaCaixa =
      ehAtendente && statusAntes === "EM_ANDAMENTO" && pendentes === 0;

    setOcupado(true);
    try {
      await vendasApi.finalizar(idVendaEncerrada);

      if (recebeuPagamento || vaiParaAvaliacao || atendenteLiberouParaCaixa) {
        toastSucesso(
          recebeuPagamento
            ? "Pagamento registrado."
            : vaiParaAvaliacao
              ? "Enviada para avaliação do farmacêutico."
              : "Venda liberada para o caixa.",
        );
        reiniciarPainel();
        navigate("/registrar-venda", { replace: true });
        return;
      }

      const atualizada = await vendasApi.localizar(idVendaEncerrada);
      if (atualizada) setVenda(atualizada);
      await carregarResumo(idVendaEncerrada);
      toastSucesso("Pronto para receber o pagamento.");
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }

  async function onFinalizar() {
    if (!venda?.id || !podeAvancar) return;

    if (venda.status === "EM_ANDAMENTO") {
      if (ehAtendente && vendaExigePrescricao(linhas)) {
        setOcupado(true);
        try {
          const jaCadastradas = await prescricoesApi.listarPorVenda(venda.id);
          if (jaCadastradas.length < 1) {
            setModalPrescricoes(true);
            return;
          }
        } catch (err) {
          toastErro(getErrorMessage(err));
          return;
        } finally {
          setOcupado(false);
        }
      }
    }

    await executarFinalizacao();
  }

  function aoPrescricoesConcluidas() {
    setModalPrescricoes(false);
    void executarFinalizacao();
  }

  function nomeProduto(produtoId: number): string {
    return indiceProdutos.get(produtoId)?.nome ?? `Produto #${produtoId}`;
  }

  function rotuloMaximo(produtoId: number): string {
    const produto = indiceProdutos.get(produtoId);
    if (!produto || !ehControlado(produto) || produto.quantidadeMaxima == null) return "";
    return ` · máx. ${produto.quantidadeMaxima}`;
  }

  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const data = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const unidades = linhas.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-ink px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={voltar}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <IconArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <IconRegister size={20} className="hidden shrink-0 text-white/70 sm:block" />
          <p className="truncate text-sm font-semibold tracking-wide sm:text-base">PDV · Registrar venda</p>
          {venda?.id != null ? (
            <span className="hidden rounded-md bg-white/10 px-2 py-1 font-mono text-xs sm:inline">
              #{venda.id}
            </span>
          ) : null}
          {venda ? (
            <span className={`hidden rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide sm:inline ${statusCor(venda.status)}`}>
              {statusVendaLabel[venda.status]}
            </span>
          ) : null}
        </div>

        <div className="hidden text-right sm:block">
          <p className="font-mono text-sm tabular-nums text-white/90">{hora}</p>
          <p className="text-[11px] text-white/50">{data}</p>
        </div>
        {usuario ? (
          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="text-[11px] text-white/50">{perfilLabel[usuario.perfil]}</p>
          </div>
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_min(420px,38%)]">
        <section className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          <form
            className="flex shrink-0 items-stretch gap-2 border-b border-white/10 p-3"
            onSubmit={onBuscaSubmit}
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar produto</span>
              <IconSearch
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={onBuscaKeyDown}
                autoFocus
                disabled={ocupado || (Boolean(venda) && !podeAlterar)}
                placeholder="Nome ou código de barras — Enter adiciona"
                className="h-12 w-full rounded-md border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-green/70 disabled:opacity-40"
              />
            </label>
            <label className="w-20 shrink-0">
              <span className="sr-only">Quantidade</span>
              <input
                type="number"
                min={1}
                step={1}
                value={quantidade}
                onChange={(event) => setQuantidade(event.target.value)}
                disabled={ocupado || (Boolean(venda) && !podeAlterar)}
                className="h-12 w-full rounded-md border border-white/15 bg-white/5 text-center font-mono text-lg tabular-nums text-white outline-none focus:border-brand-green/70 disabled:opacity-40"
              />
            </label>
          </form>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {carregandoCatalogo && catalogo.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-white/50">Carregando produtos...</p>
            ) : produtosVisiveis.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-white/50">
                Nenhum produto vendável encontrado.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {produtosVisiveis.map((produto) => (
                  <button
                    key={produto.id}
                    type="button"
                    disabled={ocupado || (Boolean(venda) && !podeAlterar)}
                    onClick={() => void adicionarProduto(produto)}
                    className="flex min-h-[7.5rem] flex-col rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:border-brand-green/50 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{produto.nome}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-white/45">{produto.codigoBarras}</p>
                    {ehControlado(produto) && produto.quantidadeMaxima != null ? (
                      <p className="mt-1 text-[11px] font-semibold text-amber-soft">
                        Máx. {produto.quantidadeMaxima} un.
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <span className="text-sm font-bold tabular-nums text-brand-green">
                        {moeda(produto.preco)}
                      </span>
                      <span className="text-[11px] text-white/45">{produto.quantidadeEstoque} un.</span>
                    </div>
                    {produto.classificacao !== "LIVRE" ? (
                      <span className="mt-1.5 w-fit rounded-sm bg-amber-ink/90 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        {classificacaoLabel[produto.classificacao]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-black/25">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <IconCart size={18} className="text-white/60" />
              <p className="text-sm font-semibold uppercase tracking-wider">Cupom</p>
            </div>
            {venda?.id != null ? (
              <p className="font-mono text-xs text-white/55">#{venda.id}</p>
            ) : (
              <p className="text-xs text-white/40">Sem venda aberta</p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {linhas.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center text-white/40">
                <IconCart size={28} className="mb-3 opacity-50" />
                <p className="text-sm">
                  {venda ? "Toque num produto para incluir no cupom." : "Toque num produto para começar."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {linhas.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{nomeProduto(item.produtoId)}</p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {moeda(item.precoUnitario)} un.
                          {item.exigeAvaliacao
                            ? item.aprovadoFarmaceutico
                              ? " · aprovado"
                              : " · aval. pendente"
                            : ""}
                          {rotuloMaximo(item.produtoId)}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                        {moeda(item.precoSubtotal)}
                      </p>
                    </div>
                    {podeAlterar ? (
                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={ocupado}
                          aria-label="Diminuir quantidade"
                          onClick={() => void alterarQuantidade(item, item.quantidade - 1)}
                          className="flex size-8 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
                        >
                          <IconMinus size={14} />
                        </button>
                        <span className="min-w-8 text-center font-mono text-sm tabular-nums">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          disabled={ocupado}
                          aria-label="Aumentar quantidade"
                          onClick={() => void alterarQuantidade(item, item.quantidade + 1)}
                          className="flex size-8 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
                        >
                          <IconPlus size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={ocupado}
                          aria-label="Remover item"
                          onClick={() => void removerItem(item)}
                          className="ml-auto flex size-8 items-center justify-center rounded-md bg-brand-red/20 text-brand-red hover:bg-brand-red hover:text-white disabled:opacity-40"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <footer className="grid shrink-0 grid-cols-1 border-t border-white/10 bg-black/40 sm:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:justify-start sm:gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">Itens</p>
            <p className="font-mono text-xl tabular-nums">{unidades}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">Total</p>
            <p className="font-mono text-3xl font-bold tabular-nums text-brand-green sm:text-4xl">
              {moeda(total)}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={ocupado || !podeCancelar}
          onClick={() => void onCancelarVenda()}
          className="mx-3 mb-2 inline-flex h-9 items-center justify-center gap-1.5 self-center rounded-md bg-white/10 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/80 transition hover:bg-brand-red hover:text-white disabled:opacity-35 sm:mx-2 sm:mb-0"
        >
          <IconClose size={13} />
          Cancelar venda
        </button>

        <button
          type="button"
          disabled={ocupado || !podeAvancar}
          onClick={() => void onFinalizar()}
          className="mx-3 mb-3 flex items-center justify-center rounded-md bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-dark disabled:opacity-35 sm:mx-3 sm:my-3 sm:min-w-52"
        >
          {ocupado ? "Aguarde..." : rotuloFinalizar(venda?.status)}
        </button>
      </footer>

      {venda?.id != null && ehAtendente ? (
        <ModalPrescricoesVenda
          open={modalPrescricoes}
          vendaId={venda.id}
          linhas={linhas}
          indiceProdutos={indiceProdutos}
          prescricoesApi={prescricoesApi}
          onClose={() => setModalPrescricoes(false)}
          onConcluido={aoPrescricoesConcluidas}
        />
      ) : null}
    </div>
  );
}
