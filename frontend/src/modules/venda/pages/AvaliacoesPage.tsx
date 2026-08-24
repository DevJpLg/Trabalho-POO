import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  statusVendaLabel,
  type PrescricaoDTO,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Card, SectionTitle } from "../../../shared/ui/Card";
import { data as formatarData, dataHora, diasAte } from "../../../shared/ui/format";
import { Alert, EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { IconAlert, IconCheck, IconRefresh } from "../../../shared/ui/icons";
import { PrescricaoRepository } from "../../prescricao/prescricao.repository";
import { PrescricaoService } from "../../prescricao/prescricao.service";
import { VendaRepository } from "../venda.repository";
import { VendaService } from "../venda.service";

/**
 * Fila de avaliação do farmacêutico.
 *
 * Mostra as vendas paradas em `EM_AVALIACAO` junto das prescrições registradas
 * para cada uma. A aprovação item a item não aparece aqui porque o backend só
 * libera `GET /itens-venda/venda/:id` para ATENDENTE e CAIXA — o farmacêutico
 * não consegue nem listar os itens que deveria avaliar (ver ERROS_BACKEND.md).
 */
export function AvaliacoesPage() {
  usePageTitle("Avaliações");
  const { http } = useAuth();

  const vendas = useMemo(() => new VendaService(new VendaRepository(http)), [http]);
  const prescricoes = useMemo(
    () => new PrescricaoService(new PrescricaoRepository(http)),
    [http],
  );

  const [fila, setFila] = useState<VendaDTO[]>([]);
  const [receitas, setReceitas] = useState<PrescricaoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avisoPrescricoes, setAvisoPrescricoes] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAvisoPrescricoes(null);

    try {
      setFila(await vendas.listarEmAvaliacao());
    } catch (err) {
      setError(getErrorMessage(err));
      setFila([]);
    }

    try {
      setReceitas(await prescricoes.listar());
    } catch (err) {
      setReceitas([]);
      setAvisoPrescricoes(getErrorMessage(err));
    }

    setLoading(false);
  }, [vendas, prescricoes]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const receitasDaVenda = (vendaId: number | null): PrescricaoDTO[] =>
    vendaId == null ? [] : receitas.filter((receita) => Number(receita.vendaId) === vendaId);

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

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {avisoPrescricoes ? (
        <div className="mb-4">
          <Alert tone="info">Não foi possível carregar as prescrições: {avisoPrescricoes}</Alert>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Carregando fila de avaliação..." />
      ) : fila.length === 0 ? (
        <EmptyState
          icone={<IconCheck size={22} />}
          titulo="Fila de avaliação vazia"
          descricao="Nenhuma venda aguardando validação farmacêutica no momento."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {fila.map((venda) => {
            const daVenda = receitasDaVenda(venda.id);
            return (
              <Card key={venda.id ?? Math.random()} interativo>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <SectionTitle className="mb-0">Venda #{venda.id}</SectionTitle>
                  <Badge tone="amber">{statusVendaLabel[venda.status]}</Badge>
                </div>

                <dl className="mb-5 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-muted">Aberta em</dt>
                    <dd className="font-medium text-ink">{dataHora(venda.dataHora)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Atendente</dt>
                    <dd className="font-medium text-ink">
                      {venda.idAtendente != null ? `#${venda.idAtendente}` : "—"}
                    </dd>
                  </div>
                </dl>

                {daVenda.length === 0 ? (
                  <Alert tone="error">
                    Nenhuma prescrição registrada para esta venda. Cadastre a receita antes de
                    liberar os medicamentos controlados.
                  </Alert>
                ) : (
                  <ul className="space-y-3">
                    {daVenda.map((receita) => {
                      const dias = diasAte(receita.dataValidade);
                      const vencida = dias !== null && dias < 0;
                      return (
                        <li
                          key={receita.id}
                          className="rounded-2xl bg-canvas px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-ink">
                              Receita {receita.numeroPrescricao}
                            </p>
                            <Badge tone={vencida ? "red" : "green"}>
                              {vencida ? "Vencida" : `Válida até ${formatarData(receita.dataValidade)}`}
                            </Badge>
                          </div>
                          <p className="mt-1 text-ink-muted">
                            {receita.nomePaciente} · {receita.nomeMedico} · CRM{" "}
                            {receita.numeroCrm}/{receita.ufCrm}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {receita.retencao ? "Exige retenção" : "Sem retenção"} ·{" "}
                            {receita.retida ? "receita retida" : "receita não retida"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-5">
                  <Link
                    to="/prescricoes"
                    className="rounded-full bg-canvas px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-green hover:text-white"
                  >
                    Gerenciar prescrições
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
