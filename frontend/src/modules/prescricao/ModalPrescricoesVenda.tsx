import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  UFS,
  type PrescricaoDTO,
  type PrescricaoInput,
  type ItemVendaDTO,
  type ProdutoDTO,
} from "../../shared/types/api";
import { Button } from "../../shared/ui/Button";
import { Checkbox, Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import { DateInput } from "../../shared/ui/DateInput";
import { Modal } from "../../shared/ui/Modal";
import { toastErro, toastSucesso } from "../../shared/ui/feedback";
import { getErrorMessage } from "../../shared/http/getErrorMessage";
import { IconFile, IconPlus } from "../../shared/ui/icons";
import type { PrescricaoService } from "./prescricao.service";
import { hojeISO, linhasExigemPrescricao } from "./prescricaoVenda.utils";
import { validarArquivoPdf } from "./prescricaoAnexo";

const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

type Props = {
  open: boolean;
  vendaId: number;
  linhas: ItemVendaDTO[];
  indiceProdutos: Map<number, ProdutoDTO>;
  prescricoesApi: PrescricaoService;
  onClose: () => void;
  onConcluido: () => void;
};

function formVazio(vendaId: number, retencao: boolean): PrescricaoInput {
  return {
    numeroPrescricao: "",
    nomeMedico: "",
    numeroCrm: "",
    ufCrm: "RJ",
    nomePaciente: "",
    retencao,
    dataEmissao: hojeISO(),
    dataValidade: hojeISO(),
    anexo: "",
    retida: false,
    vendaId,
  };
}

export function ModalPrescricoesVenda({
  open,
  vendaId,
  linhas,
  indiceProdutos,
  prescricoesApi,
  onClose,
  onConcluido,
}: Props) {
  const itensReceita = useMemo(() => linhasExigemPrescricao(linhas), [linhas]);
  const exigeRetencao = useMemo(
    () =>
      itensReceita.some(
        (item) => indiceProdutos.get(item.produtoId)?.retencaoReceita === true,
      ),
    [itensReceita, indiceProdutos],
  );

  const [registradas, setRegistradas] = useState<PrescricaoDTO[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(true);
  const [form, setForm] = useState<PrescricaoInput>(() => formVazio(vendaId, false));
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregandoLista(true);
    try {
      setRegistradas(await prescricoesApi.listarPorVenda(vendaId));
    } catch (err) {
      toastErro(getErrorMessage(err));
      setRegistradas([]);
    } finally {
      setCarregandoLista(false);
    }
  }, [prescricoesApi, vendaId]);

  useEffect(() => {
    if (!open) return;
    setForm(formVazio(vendaId, exigeRetencao));
    setNomeArquivo("");
    setArquivoPdf(null);
    setMostrarForm(true);
    void recarregar();
  }, [open, vendaId, exigeRetencao, recarregar]);

  const podeContinuar = registradas.length >= 1;

  function abrirFormNovaPrescricao() {
    setForm(formVazio(vendaId, exigeRetencao));
    setNomeArquivo("");
    setArquivoPdf(null);
    setMostrarForm(true);
  }

  function onArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setNomeArquivo("");
      setArquivoPdf(null);
      return;
    }
    try {
      validarArquivoPdf(file);
      setNomeArquivo(file.name);
      setArquivoPdf(file);
    } catch (err) {
      toastErro(getErrorMessage(err));
      event.target.value = "";
      setNomeArquivo("");
      setArquivoPdf(null);
    }
  }

  async function onSalvarPrescricao(event: FormEvent) {
    event.preventDefault();
    if (!form.numeroPrescricao.trim()) {
      toastErro("Informe o número da prescrição.");
      return;
    }
    if (!arquivoPdf) {
      toastErro("Faça o upload da receita em PDF.");
      return;
    }
    if (form.dataEmissao > form.dataValidade) {
      toastErro("A data de emissão não pode ser posterior à validade.");
      return;
    }

    setSalvando(true);
    try {
      const payload: PrescricaoInput = {
        ...form,
        vendaId,
        numeroPrescricao: form.numeroPrescricao.trim(),
        nomeMedico: form.nomeMedico.trim(),
        numeroCrm: form.numeroCrm.trim(),
        nomePaciente: form.nomePaciente.trim(),
      };
      const resposta = await prescricoesApi.cadastrar(payload, arquivoPdf);
      toastSucesso(resposta.message);
      setRegistradas(await prescricoesApi.listarPorVenda(vendaId));
      setForm(formVazio(vendaId, exigeRetencao));
      setNomeArquivo("");
      setArquivoPdf(null);
      setMostrarForm(false);
    } catch (err) {
      toastErro(getErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Prescrições da venda"
      descricao={`Venda #${vendaId} · cadastre pelo menos uma receita para os itens prescritos. Se precisar, inclua mais de uma.`}
      tamanho="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar ao cupom
          </Button>
          <Button type="button" disabled={!podeContinuar} onClick={onConcluido}>
            Continuar e finalizar
          </Button>
        </>
      }
    >
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-ink">
          Prescrições registradas ({registradas.length})
        </h3>

        {carregandoLista ? (
          <p className="text-sm text-ink-muted">Carregando...</p>
        ) : registradas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
            Nenhuma prescrição vinculada a esta venda ainda.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {registradas.map((prescricao) => (
              <li key={prescricao.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <IconFile size={18} className="mt-0.5 shrink-0 text-brand-green" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{prescricao.numeroPrescricao}</p>
                  <p className="text-ink-muted">
                    {prescricao.nomePaciente} · Dr(a). {prescricao.nomeMedico} · CRM{" "}
                    {prescricao.numeroCrm}/{prescricao.ufCrm}
                  </p>
                  {prescricao.anexo ? (
                    <p className="mt-0.5 text-xs text-brand-green">Anexo enviado</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!mostrarForm && registradas.length >= 1 ? (
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="secondary" onClick={abrirFormNovaPrescricao}>
              <IconPlus size={16} /> Adicionar outra prescrição
            </Button>
          </div>
        ) : null}

        {!podeContinuar ? (
          <p className="mt-2 text-xs text-amber-ink">
            Cadastre ao menos uma prescrição para continuar a finalização.
          </p>
        ) : null}
      </section>

      {mostrarForm ? (
        <form
          className="grid gap-3 rounded-2xl border border-line bg-surface-muted/40 p-4 sm:grid-cols-2"
          onSubmit={(event) => void onSalvarPrescricao(event)}
        >
          <p className="text-sm font-semibold text-ink sm:col-span-2">
            {registradas.length === 0 ? "Nova prescrição" : "Outra prescrição"} (venda #{vendaId})
          </p>
          <Input
            label="Número da prescrição"
            required
            value={form.numeroPrescricao}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, numeroPrescricao: event.target.value }))
            }
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
            onChange={(event) =>
              setForm((atual) => ({ ...atual, nomeMedico: event.target.value }))
            }
          />
          <Input
            label="Número do CRM"
            required
            value={form.numeroCrm}
            onChange={(event) =>
              setForm((atual) => ({ ...atual, numeroCrm: event.target.value }))
            }
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
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">
                Upload da receita (PDF) <span className="text-brand-red">*</span>
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                required={!arquivoPdf}
                onChange={(event) => void onArquivo(event)}
                className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {nomeArquivo ? (
                <span className="text-xs text-ink-muted">Arquivo: {nomeArquivo}</span>
              ) : null}
            </label>
          </div>
          <div className="flex flex-wrap gap-5 sm:col-span-2">
            <Checkbox
              label="Exige retenção"
              checked={form.retencao}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, retencao: event.target.checked }))
              }
            />
            <Checkbox
              label="Receita já retida"
              checked={form.retida}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, retida: event.target.checked }))
              }
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar prescrição"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
