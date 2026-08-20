import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import type { PrescricaoDTO, PrescricaoInput } from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { pageTitles } from "../../../shared/ui/nav";
import { IconClipboard, IconPlus } from "../../../shared/ui/icons";
import { PrescricaoRepository } from "../prescricao.repository";
import { PrescricaoService } from "../prescricao.service";

const emptyForm: PrescricaoInput = {
  numeroPrescricao: "",
  nomeMedico: "",
  numeroCrm: "",
  ufCrm: "RJ",
  nomePaciente: "",
  retencao: false,
  dataEmissao: "",
  dataValidade: "",
  anexo: "",
  retida: false,
  vendaId: 1,
};

function readField(row: PrescricaoDTO, key: string): unknown {
  if (key in row && row[key] != null) return row[key];
  return undefined;
}

function display(row: PrescricaoDTO, key: string): string {
  const value = readField(row, key);
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

function toForm(row: PrescricaoDTO): PrescricaoInput {
  const dataEmissao = String(readField(row, "dataEmissao") ?? "").slice(0, 10);
  const dataValidade = String(readField(row, "dataValidade") ?? "").slice(0, 10);
  return {
    numeroPrescricao: String(readField(row, "numeroPrescricao") ?? ""),
    nomeMedico: String(readField(row, "nomeMedico") ?? ""),
    numeroCrm: String(readField(row, "numeroCrm") ?? ""),
    ufCrm: String(readField(row, "ufCrm") ?? "RJ"),
    nomePaciente: String(readField(row, "nomePaciente") ?? ""),
    retencao: Boolean(readField(row, "retencao")),
    dataEmissao,
    dataValidade,
    anexo: String(readField(row, "anexo") ?? ""),
    retida: Boolean(readField(row, "retida")),
    vendaId: Number(readField(row, "vendaId") ?? 1),
  };
}

export function PrescricoesPage() {
  const location = useLocation();
  usePageTitle(pageTitles[location.pathname] ?? "Prescrições");
  const { http } = useAuth();
  const service = useMemo(() => new PrescricaoService(new PrescricaoRepository(http)), [http]);

  const [busca, setBusca] = useState("");
  const [filtroVenda, setFiltroVenda] = useState("");
  const [rows, setRows] = useState<PrescricaoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PrescricaoInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(nextBusca = busca, vendaId = filtroVenda) {
    setLoading(true);
    setError(null);
    try {
      if (vendaId.trim()) {
        setRows(await service.listarPorVenda(Number(vendaId)));
      } else {
        setRows(await service.listar(nextBusca));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: PrescricaoDTO) {
    const id = Number(readField(row, "id"));
    setEditingId(Number.isFinite(id) ? id : null);
    setForm(toForm(row));
    setModalOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId != null) {
        const result = await service.editar(editingId, form);
        setSuccess(result.message);
      } else {
        const result = await service.cadastrar(form);
        setSuccess(result.message);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: PrescricaoDTO) {
    const id = Number(readField(row, "id"));
    if (!Number.isFinite(id)) {
      setError("Não foi possível identificar o ID da prescrição na resposta da API.");
      return;
    }
    if (!confirm(`Excluir prescrição #${id}?`)) return;
    try {
      const result = await service.deletar(id);
      setSuccess(result.message);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        description="Cadastro e consulta de receitas vinculadas a vendas."
        actions={
          <Button type="button" onClick={openCreate}>
            <IconPlus size={16} /> Nova prescrição
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={rows.length} icon={<IconClipboard />} tone="green" />
        <StatCard
          label="Retidas"
          value={rows.filter((r) => Boolean(readField(r, "retida"))).length}
          icon={<IconClipboard />}
          tone="red"
        />
        <StatCard
          label="Com retenção"
          value={rows.filter((r) => Boolean(readField(r, "retencao"))).length}
          icon={<IconClipboard />}
          tone="rose"
        />
        <StatCard
          label="Pacientes"
          value={new Set(rows.map((r) => display(r, "nomePaciente"))).size}
          icon={<IconClipboard />}
          tone="mint"
        />
      </div>

      <form
        className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px_auto_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          void load(busca, filtroVenda);
        }}
      >
        <Input
          placeholder="Busca geral"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Input
          placeholder="Filtrar por vendaId"
          type="number"
          value={filtroVenda}
          onChange={(e) => setFiltroVenda(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setBusca("");
            setFiltroVenda("");
            void load("", "");
          }}
        >
          Limpar
        </Button>
      </form>

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

      {loading ? (
        <LoadingState />
      ) : (
        <Table
          rows={rows}
          rowKey={(r) => String(readField(r, "id") ?? JSON.stringify(r))}
          columns={[
            { key: "id", header: "ID", render: (r) => display(r, "id") },
            { key: "numero", header: "Número", render: (r) => display(r, "numeroPrescricao") },
            { key: "paciente", header: "Paciente", render: (r) => display(r, "nomePaciente") },
            { key: "medico", header: "Médico", render: (r) => display(r, "nomeMedico") },
            {
              key: "crm",
              header: "CRM",
              render: (r) => `${display(r, "numeroCrm")}/${display(r, "ufCrm")}`,
            },
            { key: "venda", header: "Venda", render: (r) => display(r, "vendaId") },
            {
              key: "retida",
              header: "Retida",
              render: (r) => (
                <Badge tone={Boolean(readField(r, "retida")) ? "red" : "green"}>
                  {Boolean(readField(r, "retida")) ? "Sim" : "Não"}
                </Badge>
              ),
            },
            {
              key: "acoes",
              header: "Ações",
              render: (r) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => openEdit(r)}>
                    Editar
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void onDelete(r)}>
                    Excluir
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId != null ? "Editar prescrição" : "Nova prescrição"}
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
            onChange={(e) => setForm((f) => ({ ...f, numeroPrescricao: e.target.value }))}
          />
          <Input
            label="Venda ID"
            type="number"
            required
            value={form.vendaId}
            onChange={(e) => setForm((f) => ({ ...f, vendaId: Number(e.target.value) }))}
          />
          <Input
            label="Nome do médico"
            required
            value={form.nomeMedico}
            onChange={(e) => setForm((f) => ({ ...f, nomeMedico: e.target.value }))}
          />
          <Input
            label="Nome do paciente"
            required
            value={form.nomePaciente}
            onChange={(e) => setForm((f) => ({ ...f, nomePaciente: e.target.value }))}
          />
          <Input
            label="CRM"
            required
            value={form.numeroCrm}
            onChange={(e) => setForm((f) => ({ ...f, numeroCrm: e.target.value }))}
          />
          <Input
            label="UF CRM"
            required
            maxLength={2}
            value={form.ufCrm}
            onChange={(e) => setForm((f) => ({ ...f, ufCrm: e.target.value.toUpperCase() }))}
          />
          <Input
            label="Data emissão"
            type="date"
            required
            value={form.dataEmissao}
            onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))}
          />
          <Input
            label="Data validade"
            type="date"
            required
            value={form.dataValidade}
            onChange={(e) => setForm((f) => ({ ...f, dataValidade: e.target.value }))}
          />
          <Input
            label="Anexo (URL/texto)"
            value={form.anexo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, anexo: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.retencao}
              onChange={(e) => setForm((f) => ({ ...f, retencao: e.target.checked }))}
            />
            Retenção
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.retida}
              onChange={(e) => setForm((f) => ({ ...f, retida: e.target.checked }))}
            />
            Retida
          </label>
        </form>
      </Modal>
    </div>
  );
}
