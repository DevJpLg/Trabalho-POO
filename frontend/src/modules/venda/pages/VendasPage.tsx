import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import type { StatusVenda, VendaDTO } from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Alert, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { VendaRepository } from "../venda.repository";
import { VendaService } from "../venda.service";

const statusLabel: Record<StatusVenda, string> = {
  EM_ANDAMENTO: "Em aberto",
  EM_AVALIACAO: "Em avaliação",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function isStatusVenda(value: string | null): value is StatusVenda {
  return Boolean(value && value in statusLabel);
}

export function VendasPage() {
  const [params] = useSearchParams();
  const statusParam = params.get("status");
  const statusFiltro = isStatusVenda(statusParam) ? statusParam : undefined;
  usePageTitle(statusFiltro ? `Vendas · ${statusLabel[statusFiltro]}` : "Vendas");
  const { http } = useAuth();
  const service = useMemo(() => new VendaService(new VendaRepository(http)), [http]);

  const [rows, setRows] = useState<VendaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    service
      .listar(statusFiltro)
      .then((vendas) => {
        if (alive) setRows(vendas);
      })
      .catch((err: unknown) => {
        if (alive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [service, statusFiltro]);

  return (
    <div>
      <PageHeader
        description={
          statusFiltro
            ? `Listando vendas com status “${statusLabel[statusFiltro]}”.`
            : "Todas as vendas registradas."
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(venda) => venda.id ?? 0}
          emptyMessage={
            statusFiltro
              ? `Nenhuma venda ${statusLabel[statusFiltro].toLowerCase()}.`
              : "Nenhuma venda encontrada."
          }
          columns={[
            { key: "id", header: "ID", render: (venda) => venda.id ?? "—" },
            {
              key: "dataHora",
              header: "Data",
              render: (venda) =>
                venda.dataHora ? new Date(venda.dataHora).toLocaleString("pt-BR") : "—",
            },
            {
              key: "status",
              header: "Status",
              render: (venda) => (
                <Badge tone={venda.status === "EM_AVALIACAO" ? "amber" : "green"}>
                  {statusLabel[venda.status]}
                </Badge>
              ),
            },
            { key: "atendente", header: "Atendente", render: (venda) => venda.idAtendente ?? "—" },
            { key: "caixa", header: "Caixa", render: (venda) => venda.idCaixa ?? "—" },
            {
              key: "farmaceutico",
              header: "Farmacêutico",
              render: (venda) => venda.idFarmaceutico ?? "—",
            },
          ]}
        />
      )}
    </div>
  );
}
