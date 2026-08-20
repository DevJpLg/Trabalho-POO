import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import type { Perfil, UsuarioDTO, UsuarioInput } from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { Input, Select } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import { pageTitles } from "../../../shared/ui/nav";
import { IconPlus, IconUsers } from "../../../shared/ui/icons";
import { UsuarioRepository } from "../usuario.repository";
import { UsuarioService } from "../usuario.service";

const perfilOptions = [
  { value: "GERENTE", label: "Gerente" },
  { value: "ATENDENTE", label: "Atendente" },
  { value: "FARMACEUTICO", label: "Farmacêutico" },
  { value: "CAIXA", label: "Caixa" },
];

const emptyForm: UsuarioInput = {
  nome: "",
  email: "",
  senha: "",
  perfil: "ATENDENTE",
  numeroCRM: "",
};

export function UsuariosPage() {
  const location = useLocation();
  usePageTitle(pageTitles[location.pathname] ?? "Usuários");
  const { http } = useAuth();
  const service = useMemo(() => new UsuarioService(new UsuarioRepository(http)), [http]);

  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState<UsuarioInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(currentBusca = busca) {
    setLoading(true);
    setError(null);
    try {
      setRows(await service.listar(currentBusca));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.pathname === "/usuarios/novo") {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user: UsuarioDTO) {
    setEditing(user);
    setForm({
      nome: user.nome,
      email: user.email,
      senha: "",
      perfil: user.perfil,
      numeroCRM: "",
    });
    setModalOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: UsuarioInput = {
        nome: form.nome,
        email: form.email,
        perfil: form.perfil,
        numeroCRM: form.perfil === "FARMACEUTICO" ? form.numeroCRM : undefined,
      };
      if (form.senha.trim() !== "") {
        payload.senha = form.senha;
      }
      if (editing) {
        const result = await service.editar(editing.id, payload);
        setSuccess(result.message);
      } else {
        const result = await service.cadastrar(payload);
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

  async function onDelete(user: UsuarioDTO) {
    if (!confirm(`Excluir o usuário ${user.nome}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await service.deletar(user.id);
      setSuccess("Usuário removido.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const byPerfil = (perfil: UsuarioDTO["perfil"]) => rows.filter((u) => u.perfil === perfil).length;

  return (
    <div>
      <PageHeader
        description="Cadastro e manutenção de perfis da equipe."
        actions={
          <Button type="button" onClick={openCreate}>
            <IconPlus size={16} /> Novo usuário
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gerentes" value={byPerfil("GERENTE")} icon={<IconUsers />} tone="red" />
        <StatCard label="Atendentes" value={byPerfil("ATENDENTE")} icon={<IconUsers />} tone="green" />
        <StatCard label="Farmacêuticos" value={byPerfil("FARMACEUTICO")} icon={<IconUsers />} tone="mint" />
        <StatCard label="Caixas" value={byPerfil("CAIXA")} icon={<IconUsers />} tone="rose" />
      </div>

      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void load(busca);
        }}
      >
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
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
          rowKey={(u) => u.id}
          columns={[
            { key: "id", header: "ID", render: (u) => u.id },
            { key: "nome", header: "Nome", render: (u) => u.nome },
            { key: "email", header: "E-mail", render: (u) => u.email },
            {
              key: "perfil",
              header: "Perfil",
              render: (u) => (
                <Badge tone={u.perfil === "GERENTE" ? "red" : "green"}>{u.perfil}</Badge>
              ),
            },
            {
              key: "acoes",
              header: "Ações",
              render: (u) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => openEdit(u)}>
                    Editar
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void onDelete(u)}>
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
        title={editing ? "Editar usuário" : "Novo usuário"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="usuario-form" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="usuario-form" className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="Nome"
            required
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Senha"
            type="password"
            required={!editing}
            placeholder={"********"}
            value={form.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
          />
          <Select
            label="Perfil"
            options={perfilOptions}
            value={form.perfil}
            onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as Perfil }))}
          />
          {form.perfil === "FARMACEUTICO" ? (
            <div className="sm:col-span-2">
              <Input
                label="Número CRM / CRF"
                value={form.numeroCRM ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, numeroCRM: e.target.value }))}
              />
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
