import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { podeGerenciarUsuarios } from "../../../shared/auth/permissoes";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  STATUS_VENDA,
  statusVendaLabel,
  type StatusVenda,
  type UsuarioDTO,
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
  const [params, setParams] = useSearchParams();
  const statusParam = params.get("status");
  const statusFiltro = isStatusVenda(statusParam) ? statusParam : undefined;
  usePageTitle(statusFiltro ? `Vendas · ${statusVendaLabel[statusFiltro]}` : "Vendas");

  const { http, usuario } = useAuth();
  const vendas = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const usuarios = useMemo(() => new UsuarioService(new UsuarioRepository(http)), [http]);
  const listaUsuariosDisponivel = podeGerenciarUsuarios(usuario?.perfil);

  const [rows, setRows] = useState<VendaDTO[]>([]);
  const [equipe, setEquipe] = useState<UsuarioDTO[]>([]);
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
    if (!listaUsuariosDisponivel) return;
    let ativo = true;
    usuarios
      .listar("")
      .then((lista) => {
        if (ativo) setEquipe(lista);
      })
      .catch(() => {
        if (ativo) setEquipe([]);
      });
    return () => {
      ativo = false;
    };
  }, [usuarios, listaUsuariosDisponivel]);

  function nomeDe(id: number | null): string {
    if (id == null) return "—";
    const encontrado = equipe.find((membro) => membro.id === id);
    return encontrado ? encontrado.nome : `#${id}`;
  }

  function aplicarStatus(status: StatusVenda | undefined) {
    if (status) setParams({ status });
    else setParams({});
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
            { key: "id", header: "ID", render: (venda) => venda.id ?? "—" },
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
