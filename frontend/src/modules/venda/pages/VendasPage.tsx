import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import {
  podeRegistrarVendaPdv,
  vendaAbrivelNoPdv,
} from "../../../shared/auth/permissoes";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  STATUS_VENDA,
  statusVendaLabel,
  type StatusVenda,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { dataHora } from "../../../shared/ui/format";
import { toastErro } from "../../../shared/ui/feedback";
import { EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { IconCart, IconRefresh } from "../../../shared/ui/icons";
import { UsuarioRepository } from "../../usuario/usuario.repository";
import { UsuarioService } from "../../usuario/usuario.service";
import { VendaRepository } from "../venda.repository";
import { VendaService } from "../venda.service";

function isStatusVenda(valor: string | null): valor is StatusVenda {
  return Boolean(valor && (STATUS_VENDA as readonly string[]).includes(valor));
}

function statusTone(status: StatusVenda) {
  if (status === "EM_AVALIACAO") return "amber" as const;
  if (status === "CANCELADA") return "red" as const;
  if (status === "FINALIZADA") return "neutral" as const;
  return "green" as const;
}

export function VendasPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const statusParam = params.get("status");
  const statusFiltro = isStatusVenda(statusParam) ? statusParam : undefined;
  usePageTitle(statusFiltro ? `Vendas · ${statusVendaLabel[statusFiltro]}` : "Vendas");

  const { http, usuario } = useAuth();
  const vendas = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const usuarios = useMemo(() => new UsuarioService(new UsuarioRepository(http)), [http]);
  const podeAbrirNoPdv = podeRegistrarVendaPdv(usuario?.perfil);

  const [rows, setRows] = useState<VendaDTO[]>([]);
  const [mapaNomes, setMapaNomes] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await vendas.listar(statusFiltro));
    } catch (err) {
      toastErro(getErrorMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [vendas, statusFiltro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    let ativo = true;

    usuarios
      .listar("")
      .then((lista) => {
        if (!ativo) return;
        const proximo = new Map<number, string>();
        lista.forEach((membro) => proximo.set(membro.id, membro.nome));
        setMapaNomes(proximo);
      })
      .catch(() => {
        if (!ativo) return;
        const proximo = new Map<number, string>();
        if (usuario) proximo.set(usuario.id, usuario.nome);
        setMapaNomes(proximo);
      });

    return () => {
      ativo = false;
    };
  }, [usuarios, usuario]);

  function nomeDe(id: number | null): string {
    if (id == null) return "—";
    return mapaNomes.get(id) ?? `#${id}`;
  }

  function aplicarStatus(status: StatusVenda | undefined) {
    if (status) setParams({ status });
    else setParams({});
  }

  function abrirVendaNoPdv(venda: VendaDTO) {
    if (!podeAbrirNoPdv || venda.id == null || !vendaAbrivelNoPdv(usuario?.perfil, venda.status)) {
      return;
    }
    navigate(`/registrar-venda?venda=${venda.id}`);
  }

  return (
    <div>
      <BarraListagem
        mostrarBusca={false}
        acao={
          <Button type="button" variant="secondary" onClick={() => void carregar()}>
            <IconRefresh size={16} /> Atualizar
          </Button>
        }
      />

      {podeAbrirNoPdv ? (
        <p className="mb-3 text-sm text-ink-muted">
          Clique numa venda <strong className="font-semibold text-ink">em aberto</strong>
          {usuario?.perfil === "CAIXA" ? (
            <> ou <strong className="font-semibold text-ink">aguardando pagamento</strong></>
          ) : null}{" "}
          para continuar no painel de registro.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant={statusFiltro ? "ghost" : "success"}
          onClick={() => aplicarStatus(undefined)}
        >
          Todas
        </Button>
        {STATUS_VENDA.map((status) => (
          <Button
            key={status}
            type="button"
            variant={statusFiltro === status ? "success" : "ghost"}
            onClick={() => aplicarStatus(status)}
          >
            {statusVendaLabel[status]}
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(venda) => venda.id ?? 0}
          onRowClick={(venda) => {
            if (
              !podeAbrirNoPdv ||
              venda.id == null ||
              !vendaAbrivelNoPdv(usuario?.perfil, venda.status)
            ) {
              return;
            }
            abrirVendaNoPdv(venda);
          }}
          empty={
            <EmptyState
              icone={<IconCart size={22} />}
              titulo={
                statusFiltro
                  ? `Nenhuma venda em “${statusVendaLabel[statusFiltro]}”`
                  : "Nenhuma venda registrada"
              }
              descricao={
                statusFiltro
                  ? "Troque o filtro acima para ver as vendas em outros estágios."
                  : "As vendas aparecem aqui assim que forem abertas no atendimento."
              }
            />
          }
          columns={[
            {
              key: "id",
              header: "ID",
              render: (venda) =>
                podeAbrirNoPdv &&
                venda.id != null &&
                vendaAbrivelNoPdv(usuario?.perfil, venda.status) ? (
                  <span className="font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-2">
                    {venda.id}
                  </span>
                ) : (
                  (venda.id ?? "—")
                ),
            },
            { key: "dataHora", header: "Data", render: (venda) => dataHora(venda.dataHora) },
            {
              key: "status",
              header: "Status",
              render: (venda) => (
                <Badge dot tone={statusTone(venda.status)}>
                  {statusVendaLabel[venda.status]}
                </Badge>
              ),
            },
            {
              key: "atendente",
              header: "Atendente",
              render: (venda) => nomeDe(venda.idAtendente),
            },
            { key: "caixa", header: "Caixa", render: (venda) => nomeDe(venda.idCaixa) },
            {
              key: "farmaceutico",
              header: "Farmacêutico",
              render: (venda) => nomeDe(venda.idFarmaceutico),
            },
          ]}
        />
      )}
    </div>
  );
}
