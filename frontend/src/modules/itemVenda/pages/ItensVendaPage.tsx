import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import type { ItemVendaDTO } from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Alert, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { pageTitles } from "../../../shared/ui/nav";
import { IconCart, IconPlus } from "../../../shared/ui/icons";
import { ItemVendaRepository } from "../itemVenda.repository";
import { ItemVendaService } from "../itemVenda.service";

const SEED_VENDAS = [1, 2, 3, 4, 5];

export function ItensVendaPage() {
  const location = useLocation();
  usePageTitle(pageTitles[location.pathname] ?? "Itens de venda");
  const { http } = useAuth();
  const service = useMemo(() => new ItemVendaService(new ItemVendaRepository(http)), [http]);

  const [vendaIdInput, setVendaIdInput] = useState("1");
  const [vendaId, setVendaId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<ItemVendaDTO[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  async function load(id: number, currentBusca = busca) {
    setLoading(true);
    setError(null);
    try {
      const [itens, totalResp] = await Promise.all([
        service.listar(id, currentBusca),
        service.calcularTotal(id),
      ]);
      setRows(itens);
      setTotal(totalResp.total);
      setVendaId(id);
    } catch (err) {
      setError(getErrorMessage(err));
      setRows([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyVendaId(event: FormEvent) {
    event.preventDefault();
    const id = Number(vendaIdInput);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Informe um ID de venda válido.");
      return;
    }
    void load(id);
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    if (vendaId == null) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await service.adicionar(vendaId, Number(produtoId), Number(quantidade));
      setSuccess(result.message);
      setProdutoId("");
      setQuantidade("1");
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onUpdateQty(item: ItemVendaDTO) {
    if (vendaId == null) return;
    const next = prompt("Nova quantidade", String(item.quantidade));
    if (next == null) return;
    try {
      const result = await service.atualizarQuantidade(vendaId, item.id, Number(next));
      setSuccess(result.message);
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onRemove(item: ItemVendaDTO) {
    if (vendaId == null) return;
    if (!confirm(`Remover item #${item.id}?`)) return;
    try {
      await service.remover(vendaId, item.id);
      setSuccess("Item removido.");
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onAprovar(item: ItemVendaDTO) {
    if (vendaId == null) return;
    try {
      const result = await service.aprovarItem(vendaId, item.id);
      setSuccess(result.message);
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onRecusar(item: ItemVendaDTO) {
    if (vendaId == null) return;
    try {
      const result = await service.recusarItem(vendaId, item.id);
      setSuccess(result.message);
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onAvaliar(aprovado: boolean) {
    if (vendaId == null) return;
    try {
      const result = await service.avaliarVenda(vendaId, aprovado);
      setSuccess(result.message);
      await load(vendaId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader description="Informe um vendaId existente (seed 1–5) para gerenciar os itens." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Venda" value={vendaId ?? "—"} icon={<IconCart />} tone="green" />
        <StatCard label="Itens" value={rows.length} icon={<IconCart />} tone="mint" />
        <StatCard
          label="Pendentes"
          value={rows.filter((i) => i.exigeAvaliacao && !i.aprovadoFarmaceutico).length}
          icon={<IconCart />}
          tone="red"
        />
        <StatCard
          label="Total"
          value={
            total != null
              ? Number(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "—"
          }
          icon={<IconPlus />}
          tone="rose"
        />
      </div>

      <form
        onSubmit={applyVendaId}
        className="mb-4 flex flex-col gap-3 rounded-[25px] bg-white p-5 shadow-[0_8px_30px_rgba(26,46,37,0.04)] sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="ID da venda"
            type="number"
            min="1"
            value={vendaIdInput}
            onChange={(e) => setVendaIdInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          Carregar
        </Button>
        <div className="flex flex-wrap gap-1.5">
          {SEED_VENDAS.map((id) => (
            <Button
              key={id}
              type="button"
              variant={vendaId === id ? "success" : "ghost"}
              onClick={() => {
                setVendaIdInput(String(id));
                void load(id);
              }}
            >
              #{id}
            </Button>
          ))}
        </div>
      </form>

      {vendaId != null ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[25px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(26,46,37,0.04)]">
          <p className="text-sm font-semibold text-brand-green">
            Venda #{vendaId}
            {total != null
              ? ` · Total ${Number(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="success" onClick={() => void onAvaliar(true)}>
              Avaliar: aprovar
            </Button>
            <Button type="button" variant="danger" onClick={() => void onAvaliar(false)}>
              Avaliar: recusar
            </Button>
          </div>
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

      {vendaId != null ? (
        <>
          <form
            onSubmit={onAdd}
            className="mb-4 grid gap-3 rounded-[25px] bg-white p-5 shadow-[0_8px_30px_rgba(26,46,37,0.04)] sm:grid-cols-4"
          >
            <Input
              label="Produto ID"
              type="number"
              required
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
            />
            <Input
              label="Quantidade"
              type="number"
              min="1"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                Adicionar item
              </Button>
            </div>
          </form>

          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (vendaId != null) void load(vendaId, busca);
            }}
          >
            <div className="flex-1">
              <Input
                placeholder="Filtrar itens (busca no produto)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(i) => i.id}
          emptyMessage="Nenhum item nesta venda."
          columns={[
            { key: "id", header: "ID", render: (i) => i.id },
            { key: "produto", header: "Produto", render: (i) => i.produtoId },
            { key: "qtd", header: "Qtd", render: (i) => i.quantidade },
            {
              key: "unit",
              header: "Unitário",
              render: (i) =>
                Number(i.precoUnitario).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
            },
            {
              key: "sub",
              header: "Subtotal",
              render: (i) =>
                Number(i.precoSubtotal).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
            },
            {
              key: "aval",
              header: "Avaliação",
              render: (i) =>
                i.exigeAvaliacao ? (
                  <Badge tone={i.aprovadoFarmaceutico ? "green" : "amber"}>
                    {i.aprovadoFarmaceutico ? "Aprovado" : "Pendente"}
                  </Badge>
                ) : (
                  <Badge>Livre</Badge>
                ),
            },
            {
              key: "acoes",
              header: "Ações",
              render: (i) => (
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="secondary" onClick={() => void onUpdateQty(i)}>
                    Qtd
                  </Button>
                  {i.exigeAvaliacao ? (
                    <>
                      <Button type="button" variant="success" onClick={() => void onAprovar(i)}>
                        Aprovar
                      </Button>
                      <Button type="button" variant="danger" onClick={() => void onRecusar(i)}>
                        Recusar
                      </Button>
                    </>
                  ) : null}
                  <Button type="button" variant="danger" onClick={() => void onRemove(i)}>
                    Remover
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
