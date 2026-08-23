import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { podeGerenciarUsuarios } from "../../../shared/auth/permissoes";
import { ApiError } from "../../../shared/http/HttpClient";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import {
  PERFIS,
  perfilLabel,
  type Perfil,
  type UsuarioDTO,
  type UsuarioInput,
} from "../../../shared/types/api";
import { Badge } from "../../../shared/ui/Badge";
import { Button, IconButton } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { Modal } from "../../../shared/ui/Modal";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../../shared/ui/PageHeader";
import { StatCard } from "../../../shared/ui/StatCard";
import { RowActions, Table } from "../../../shared/ui/Table";
import { usePageTitle } from "../../../shared/ui/usePageTitle";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconShield,
  IconTrash,
  IconUser,
  IconUsers,
} from "../../../shared/ui/icons";
import { UsuarioRepository } from "../usuario.repository";
import { UsuarioService } from "../usuario.service";

const perfilOptions = PERFIS.map((perfil) => ({ value: perfil, label: perfilLabel[perfil] }));

const tonesPerfil: Record<Perfil, "red" | "green" | "amber" | "neutral"> = {
  GERENTE: "red",
  FARMACEUTICO: "amber",
  ATENDENTE: "green",
  CAIXA: "neutral",
};

const tonePerfil = (perfil: Perfil) => tonesPerfil[perfil];

const emptyForm: UsuarioInput = {
  nome: "",
  email: "",
  senha: "",
  perfil: "ATENDENTE",
  numeroCRM: "",
};

/**
 * A aba fica visível para todos os perfis, mas o que ela mostra depende de quem
 * entrou: o gerente administra a equipe inteira; os demais veem só os próprios
 * dados de acesso, porque `GET /api/usuarios` é restrito ao gerente no backend.
 */
export function UsuariosPage() {
  usePageTitle("Usuários");
  const { usuario } = useAuth();

  return podeGerenciarUsuarios(usuario?.perfil) ? <GestaoDeUsuarios /> : <MeuAcesso />;
}

/* ==================== visão do gerente ==================== */

function GestaoDeUsuarios() {
  const { http, usuario: usuarioLogado } = useAuth();
  const service = useMemo(() => new UsuarioService(new UsuarioRepository(http)), [http]);

  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState<UsuarioInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(
    async (termo: string) => {
      setLoading(true);
      setError(null);
      setAviso(null);
      try {
        setRows(await service.listar(termo));
      } catch (err) {
        // Com um único usuário cadastrado o backend quebra ao serializar a lista
        // (ver ERROS_BACKEND.md). Mostramos o próprio usuário logado para que dê
        // para cadastrar o segundo e sair desse estado.
        if (err instanceof ApiError && err.status >= 500 && usuarioLogado) {
          setRows([usuarioLogado]);
          setAviso(
            "A API só devolve a listagem quando há mais de um usuário cadastrado. " +
              "Exibindo apenas o seu usuário — cadastre outro para a lista voltar ao normal.",
          );
        } else {
          setError(getErrorMessage(err));
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [service, usuarioLogado],
  );

  useEffect(() => {
    void carregar("");
  }, [carregar]);

  function fecharModal() {
    setModalOpen(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(usuario: UsuarioDTO) {
    setEditing(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
      perfil: usuario.perfil,
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

      const senha = (form.senha ?? "").trim();
      if (senha !== "") {
        payload.senha = senha;
      }

      const resultado = editing
        ? await service.editar(editing.id, payload)
        : await service.cadastrar(payload);

      setSuccess(resultado.message);
      fecharModal();
      await carregar(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(usuario: UsuarioDTO) {
    if (usuario.id === usuarioLogado?.id) {
      setError("Você não pode excluir o próprio usuário enquanto está logado com ele.");
      return;
    }
    if (!confirm(`Excluir o usuário ${usuario.nome}?`)) return;

    setError(null);
    setSuccess(null);
    try {
      await service.deletar(usuario.id);
      setSuccess("Usuário removido.");
      await carregar(busca);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const contar = (perfil: Perfil) => rows.filter((usuario) => usuario.perfil === perfil).length;

  return (
    <div>
      <PageHeader
        description="Cadastro e manutenção dos perfis da equipe."
        actions={
          <Button type="button" onClick={openCreate}>
            <IconPlus size={16} /> Novo usuário
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gerentes" value={contar("GERENTE")} icon={<IconUsers />} tone="red" />
        <StatCard label="Atendentes" value={contar("ATENDENTE")} icon={<IconUsers />} tone="green" />
        <StatCard
          label="Farmacêuticos"
          value={contar("FARMACEUTICO")}
          icon={<IconUsers />}
          tone="mint"
        />
        <StatCard label="Caixas" value={contar("CAIXA")} icon={<IconUsers />} tone="rose" />
      </div>

      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void carregar(busca);
        }}
      >
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, e-mail ou perfil"
            icone={<IconSearch size={17} />}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
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
      {aviso ? (
        <div className="mb-4">
          <Alert tone="info">{aviso}</Alert>
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
          rowKey={(usuario) => usuario.id}
          empty={
            <EmptyState
              icone={<IconUsers size={22} />}
              titulo={busca ? "Nenhum usuário para essa busca" : "Equipe ainda vazia"}
              descricao={
                busca
                  ? "Revise o termo ou limpe a busca para ver a equipe inteira."
                  : "Cadastre atendentes, farmacêuticos e caixas para liberar o acesso deles."
              }
              acao={
                busca ? undefined : (
                  <Button type="button" onClick={openCreate}>
                    <IconPlus size={16} /> Novo usuário
                  </Button>
                )
              }
            />
          }
          columns={[
            { key: "id", header: "ID", render: (usuario) => usuario.id },
            { key: "nome", header: "Nome", render: (usuario) => usuario.nome },
            { key: "email", header: "E-mail", render: (usuario) => usuario.email },
            {
              key: "perfil",
              header: "Perfil",
              render: (usuario) => (
                <Badge dot tone={tonePerfil(usuario.perfil)}>
                  {perfilLabel[usuario.perfil]}
                </Badge>
              ),
            },
            {
              key: "acoes",
              header: "Ações",
              fim: true,
              className: "min-w-24",
              render: (usuario) => (
                <RowActions>
                  <IconButton label="Editar usuário" onClick={() => openEdit(usuario)}>
                    <IconPencil size={17} />
                  </IconButton>
                  <IconButton
                    label="Excluir usuário"
                    tone="danger"
                    onClick={() => void onDelete(usuario)}
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
        title={editing ? "Editar usuário" : "Novo usuário"}
        onClose={fecharModal}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={fecharModal}>
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
            onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((atual) => ({ ...atual, email: event.target.value }))}
          />
          <Input
            label={editing ? "Nova senha (deixe em branco para manter)" : "Senha"}
            type="password"
            required={!editing}
            placeholder="••••••••"
            value={form.senha ?? ""}
            onChange={(event) => setForm((atual) => ({ ...atual, senha: event.target.value }))}
          />
          <Select
            label="Perfil"
            options={perfilOptions}
            value={form.perfil}
            onChange={(valor) => setForm((atual) => ({ ...atual, perfil: valor as Perfil }))}
          />
          {form.perfil === "FARMACEUTICO" ? (
            <div className="sm:col-span-2">
              <Input
                label="Número CRF"
                value={form.numeroCRM ?? ""}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, numeroCRM: event.target.value }))
                }
              />
              <p className="mt-1 text-xs text-ink-muted">
                O cadastro atual da API não persiste o CRF; o campo fica registrado aqui para quando
                o backend salvar o dado.
              </p>
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}

/* ==================== visão dos demais perfis ==================== */

function MeuAcesso() {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <EmptyState
        icone={<IconUsers size={22} />}
        titulo="Sessão não identificada"
        descricao="Entre novamente para ver os seus dados de acesso."
      />
    );
  }

  const iniciais = usuario.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div>
      <PageHeader description="Os seus dados de acesso na farmácia." />

      <Card className="mb-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-green-soft text-xl font-bold text-brand-green">
            {iniciais || <IconUser size={26} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-tight text-ink">{usuario.nome}</p>
            <p className="mt-0.5 truncate text-sm text-ink-muted">{usuario.email}</p>
            <div className="mt-3">
              <Badge dot tone={tonePerfil(usuario.perfil)}>
                {perfilLabel[usuario.perfil]}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-ink-muted">
            <IconShield size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Gestão da equipe</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              A lista completa da equipe e o cadastro de novos usuários são exclusivos do perfil
              Gerente. Para alterar os seus dados ou pedir um novo acesso, procure um gerente da
              farmácia.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
