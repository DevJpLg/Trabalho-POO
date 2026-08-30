import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  UFS,
  statusVendaLabel,
  type PrescricaoDTO,
  type PrescricaoInput,
  type VendaDTO,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button, IconButton } from "../../../shared/ui/Button";
import { data as formatarData, diasAte, paraInputDate } from "../../../shared/ui/format";
import { Checkbox, Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { DateInput } from "../../../shared/ui/DateInput";
import { Modal } from "../../../shared/ui/Modal";
import { pedirConfirmacao, toastErro, toastSucesso } from "../../../shared/ui/feedback";
import { EmptyState, LoadingState } from "../../../shared/ui/PageHeader";
import { BarraListagem } from "../../../shared/ui/BarraListagem";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { IconFile, IconPencil, IconPlus, IconTrash } from "../../../shared/ui/icons";
import { VendaRepository } from "../../venda/venda.repository";
import { VendaService } from "../../venda/venda.service";
import { PrescricaoRepository } from "../prescricao.repository";
import { PrescricaoService } from "../prescricao.service";

const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: PrescricaoInput = {
  numeroPrescricao: "",
  nomeMedico: "",
  numeroCrm: "",
  ufCrm: "RJ",
  nomePaciente: "",
  retencao: false,
  dataEmissao: hojeISO(),
  dataValidade: hojeISO(),
  anexo: "",
  retida: false,
  vendaId: 0,
};

function prescricaoToForm(prescricao: PrescricaoDTO): PrescricaoInput {
  return {
    numeroPrescricao: prescricao.numeroPrescricao ?? "",
    nomeMedico: prescricao.nomeMedico ?? "",
    numeroCrm: prescricao.numeroCrm ?? "",
    ufCrm: prescricao.ufCrm ?? "RJ",
    nomePaciente: prescricao.nomePaciente ?? "",
    retencao: Boolean(prescricao.retencao),
    dataEmissao: paraInputDate(prescricao.dataEmissao) || hojeISO(),
    dataValidade: paraInputDate(prescricao.dataValidade) || hojeISO(),
    anexo: prescricao.anexo ?? "",
    retida: Boolean(prescricao.retida),
    vendaId: Number(prescricao.vendaId ?? 0),
  };
}

export function PrescricoesPage() {
  usePageTitle("Prescrições");
  const { http } = useAuth();

  const service = useMemo(() => new PrescricaoService(new PrescricaoRepository(http)), [http]);
  const vendasApi = useMemo(() => new VendaService(new VendaRepository(http)), [http]);

  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<PrescricaoDTO[]>([]);
  const [vendas, setVendas] = useState<VendaDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PrescricaoDTO | null>(null);
  const [form, setForm] = useState<PrescricaoInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(
    async (termo: string) => {
      setLoading(true);
      try {
        setRows(await service.listar(termo));
      } catch (err) {
        toastErro(getErrorMessage(err));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [service],
  );

  useEffect(() => {
    void carregar("");
  }, [carregar]);

  useEffect(() => {
    let ativo = true;
    vendasApi
      .listar()
      .then((lista) => {
        if (ativo) setVendas(lista);
      })
      .catch(() => {
        if (ativo) setVendas([]);
      });
    return () => {
      ativo = false;
    };
  }, [vendasApi]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, vendaId: vendas[0]?.id ?? 0 });
    setModalOpen(true);
  }

  function openEdit(prescricao: PrescricaoDTO) {
    setEditing(prescricao);
    setForm(prescricaoToForm(prescricao));
    setModalOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.vendaId) {
      toastErro("Selecione a venda vinculada à prescrição.");
      return;
    }
    if (form.dataEmissao > form.dataValidade) {
      toastErro("A data de emissão não pode ser posterior à validade.");
      return;
    }

    setSaving(true);
    try {
      const payload: PrescricaoInput = { ...form, vendaId: Number(form.vendaId) };
      const resultado = editing
        ? await service.editar(Number(editing.id), payload)
        : await service.cadastrar(payload);
      toastSucesso(resultado.message);
      setModalOpen(false);
      await carregar(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(prescricao: PrescricaoDTO) {
    const confirmou = await pedirConfirmacao({
      titulo: "Excluir prescrição?",
      texto: `A prescrição ${prescricao.numeroPrescricao} será removida. Esta ação não pode ser desfeita.`,
      confirmar: "Excluir",
    });
    if (!confirmou) return;
    try {
      const resultado = await service.deletar(Number(prescricao.id));
      toastSucesso(resultado?.message ?? "Prescrição removida.");
      await carregar(busca);
    } catch (err) {
      toastErro(getErrorMessage(err));
    }
  }

  const opcoesVenda =
    vendas.length > 0
      ? vendas.map((venda) => ({
          value: String(venda.id ?? ""),
          label: `Venda #${venda.id}`,
          detalhe: statusVendaLabel[venda.status],
        }))
      : [{ value: "", label: "Nenhuma venda disponível" }];

  return (
    <div>
      <BarraListagem
        placeholder="Buscar por número, paciente, médico ou CRM"
        busca={busca}
        onBuscaChange={setBusca}
        onBuscar={() => void carregar(busca)}
        acao={
          <Button type="button" onClick={openCreate}>
            <IconPlus size={16} /> Nova prescrição
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(prescricao) => Number(prescricao.id)}
          empty={
            <EmptyState
              icone={<IconFile size={22} />}
              titulo={busca ? "Nenhuma prescrição para essa busca" : "Nenhuma prescrição cadastrada"}
              descricao={
                busca
                  ? "Revise o termo ou limpe a busca para ver todas as receitas."
                  : "Registre a receita apresentada quando a venda incluir controlados ou prescritos."
              }
              acao={
                busca ? undefined : (
                  <Button type="button" onClick={openCreate}>
                    <IconPlus size={16} /> Nova prescrição
                  </Button>
                )
              }
            />
          }
          columns={[
            {
              key: "numero",
              header: "Prescrição",
              render: (prescricao) => (
                <div>
                  <p className="font-semibold">{prescricao.numeroPrescricao}</p>
                  <p className="text-xs text-ink-muted">Venda #{prescricao.vendaId}</p>
                </div>
              ),
            },
            { key: "paciente", header: "Paciente", render: (prescricao) => prescricao.nomePaciente },
            {
              key: "medico",
              header: "Médico",
              render: (prescricao) => (
                <div>
                  <p>{prescricao.nomeMedico}</p>
                  <p className="text-xs text-ink-muted">
                    CRM {prescricao.numeroCrm}/{prescricao.ufCrm}
                  </p>
                </div>
              ),
            },
            {
              key: "emissao",
              header: "Emissão",
              render: (prescricao) => formatarData(prescricao.dataEmissao),
            },
            {
              key: "validade",
              header: "Validade",
              render: (prescricao) => {
                const dias = diasAte(prescricao.dataValidade);
                const vencida = dias !== null && dias < 0;
                return (
                  <Badge tone={vencida ? "red" : "green"}>
                    {formatarData(prescricao.dataValidade)}
                  </Badge>
                );
              },
            },
            {
              key: "retencao",
              header: "Retenção",
              render: (prescricao) =>
                prescricao.retencao ? (
                  <Badge tone={prescricao.retida ? "green" : "amber"}>
                    {prescricao.retida ? "Retida" : "Pendente"}
                  </Badge>
                ) : (
                  <Badge>Não exige</Badge>
                ),
            },
            {
              key: "acoes",
              header: "Ações",
              fim: true,
              render: (prescricao) => (
                <RowActions>
                  <IconButton label="Editar prescrição" onClick={() => openEdit(prescricao)}>
                    <IconPencil size={17} />
                  </IconButton>
                  <IconButton
                    label="Excluir prescrição"
                    tone="danger"
                    onClick={() => void onDelete(prescricao)}
                  >
                    <IconTrash size={17} />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar prescrição" : "Nova prescrição"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="prescricao-form" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="prescricao-form" className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="Número da prescrição"
            required
            value={form.numeroPrescricao}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, numeroPrescricao: event.target.value }))
            }
          />
          <Select
            label="Venda vinculada"
            options={opcoesVenda}
            value={form.vendaId ? String(form.vendaId) : ""}
            placeholder="Escolha a venda"
            onChange={(valor) => setForm((atual) => ({ ...atual, vendaId: Number(valor) }))}
          />
          <Input
            label="Nome do paciente"
            required
            value={form.nomePaciente}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, nomePaciente: event.target.value }))
            }
          />
          <Input
            label="Nome do médico"
            required
            value={form.nomeMedico}
            onChange={(event) => setForm((atual) => ({ ...atual, nomeMedico: event.target.value }))}
          />
          <Input
            label="Número do CRM"
            required
            value={form.numeroCrm}
            onChange={(event) => setForm((atual) => ({ ...atual, numeroCrm: event.target.value }))}
          />
          <Select
            label="UF do CRM"
            options={ufOptions}
            value={form.ufCrm}
            onChange={(valor) => setForm((atual) => ({ ...atual, ufCrm: valor }))}
          />
          <DateInput
            label="Data de emissão"
            required
            value={form.dataEmissao}
            onChange={(iso) => setForm((atual) => ({ ...atual, dataEmissao: iso }))}
          />
          <DateInput
            label="Data de validade"
            required
            value={form.dataValidade}
            onChange={(iso) => setForm((atual) => ({ ...atual, dataValidade: iso }))}
          />
          <div className="sm:col-span-2">
            <Input
              label="Anexo (link ou identificação do arquivo)"
              value={form.anexo ?? ""}
              onChange={(event) => setForm((atual) => ({ ...atual, anexo: event.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-end gap-5 rounded-2xl bg-surface-muted px-4 py-3 sm:col-span-2">
            <Checkbox
              label="Exige retenção"
              checked={form.retencao}
              onChange={(event) => setForm((atual) => ({ ...atual, retencao: event.target.checked }))}
            />
            <Checkbox
              label="Receita já retida"
              checked={form.retida}
              onChange={(event) => setForm((atual) => ({ ...atual, retida: event.target.checked }))}
            />
          </div>

        </form>
      </Modal>
    </div>
  );
}
