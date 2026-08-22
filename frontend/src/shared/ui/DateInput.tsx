import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCalendar, IconChevronDown } from "./icons";
import { painelFlutuante, useFecharAoSair, usePosicaoPopover } from "./popover";

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/* ========== conversões entre ISO (API) e DD/MM/AAAA (tela) ========== */

const ehIso = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor);

function isoParaBr(iso: string): string {
  if (!ehIso(iso)) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function brParaIso(br: string): string | null {
  const partes = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!partes) return null;

  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const valida =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia);

  return valida ? `${ano}-${mes}-${dia}` : null;
}

/** Vai inserindo as barras conforme o usuário digita. */
function mascarar(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function chaveDoDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Semanas (domingo a sábado) que cobrem o mês inteiro. */
function gradeDoMes(ano: number, mes: number): Date[][] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(primeiro.getDate() - primeiro.getDay());

  const semanas: Date[][] = [];
  const cursor = new Date(inicio);

  for (let semana = 0; semana < 6; semana += 1) {
    const dias: Date[] = [];
    for (let dia = 0; dia < 7; dia += 1) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(dias);
  }

  return semanas;
}

type Props = {
  label?: string;
  /** Data no formato da API: `AAAA-MM-DD`. */
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  error?: string;
  id?: string;
  placeholder?: string;
};

/**
 * Campo de data com calendário próprio.
 *
 * O `<input type="date">` nativo mostra o formato do idioma do navegador (vira
 * MM/DD/AAAA num Chrome em inglês) e não aceita estilo no calendário. Aqui a
 * digitação é sempre DD/MM/AAAA e o calendário segue os tokens do projeto; o
 * valor trafega em ISO, então nada muda para a API.
 */
export function DateInput({
  label,
  value,
  onChange,
  required = false,
  error,
  id,
  placeholder = "DD/MM/AAAA",
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(() => isoParaBr(value));
  const [mesVisivel, setMesVisivel] = useState(() => {
    const base = ehIso(value) ? new Date(`${value}T00:00:00`) : new Date();
    return { ano: base.getFullYear(), mes: base.getMonth() };
  });

  const campoRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const posicao = usePosicaoPopover(aberto, campoRef, 360);
  const fechar = useCallback(() => setAberto(false), []);
  useFecharAoSair(aberto, fechar, campoRef, painelRef);

  // Mudança vinda de fora (abrir o modal em outro registro, por exemplo).
  useEffect(() => {
    setTexto(isoParaBr(value));
    if (ehIso(value)) {
      const base = new Date(`${value}T00:00:00`);
      setMesVisivel({ ano: base.getFullYear(), mes: base.getMonth() });
    }
  }, [value]);

  const semanas = useMemo(
    () => gradeDoMes(mesVisivel.ano, mesVisivel.mes),
    [mesVisivel.ano, mesVisivel.mes],
  );
  const hoje = chaveDoDia(new Date());

  function digitar(entrada: string) {
    const mascarado = mascarar(entrada);
    setTexto(mascarado);

    const iso = brParaIso(mascarado);
    if (iso) {
      onChange(iso);
      const base = new Date(`${iso}T00:00:00`);
      setMesVisivel({ ano: base.getFullYear(), mes: base.getMonth() });
    } else if (mascarado === "") {
      onChange("");
    }
  }

  function escolherDia(dia: Date) {
    onChange(chaveDoDia(dia));
    setTexto(isoParaBr(chaveDoDia(dia)));
    setAberto(false);
  }

  function andarMes(passo: number) {
    setMesVisivel(({ ano, mes }) => {
      const data = new Date(ano, mes + passo, 1);
      return { ano: data.getFullYear(), mes: data.getMonth() };
    });
  }

  const invalido = texto.length === 10 && brParaIso(texto) === null;

  return (
    <div className="block space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
          {label}
        </label>
      ) : null}

      <div
        ref={campoRef}
        className={`flex items-center gap-2 rounded-2xl bg-surface-muted pr-2 ring-1 transition-all duration-150 hover:ring-ink-muted/35 ${
          aberto ? "bg-surface ring-2 ring-brand-green/45" : "ring-line"
        } ${error || invalido ? "ring-brand-red/50" : ""}`}
      >
        <input
          id={id}
          value={texto}
          onChange={(evento) => digitar(evento.target.value)}
          onFocus={() => setAberto(true)}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          required={required}
          aria-invalid={invalido}
          className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted/80"
        />
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          aria-label="Abrir calendário"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
        >
          <IconCalendar size={18} />
        </button>
      </div>

      {error ? <span className="text-xs font-medium text-brand-red">{error}</span> : null}
      {!error && invalido ? (
        <span className="text-xs font-medium text-brand-red">Data inválida.</span>
      ) : null}

      {aberto && posicao
        ? createPortal(
            <div
              ref={painelRef}
              className={`${painelFlutuante} p-3`}
              style={{
                position: "fixed",
                top: posicao.paraCima ? undefined : posicao.top,
                bottom: posicao.paraCima ? window.innerHeight - posicao.top : undefined,
                left: posicao.left,
                width: Math.max(posicao.width, 288),
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => andarMes(-1)}
                  aria-label="Mês anterior"
                  className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-hover hover:text-ink"
                >
                  <IconChevronDown size={16} className="rotate-90" />
                </button>
                <p className="text-sm font-semibold text-ink">
                  {MESES[mesVisivel.mes]} {mesVisivel.ano}
                </p>
                <button
                  type="button"
                  onClick={() => andarMes(1)}
                  aria-label="Próximo mês"
                  className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-hover hover:text-ink"
                >
                  <IconChevronDown size={16} className="-rotate-90" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {DIAS_SEMANA.map((dia) => (
                  <span
                    key={dia}
                    className="py-1 text-center text-[11px] font-semibold uppercase text-ink-muted"
                  >
                    {dia}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {semanas.flat().map((dia) => {
                  const chave = chaveDoDia(dia);
                  const doMes = dia.getMonth() === mesVisivel.mes;
                  const selecionado = chave === value;
                  const ehHoje = chave === hoje;

                  return (
                    <button
                      key={chave}
                      type="button"
                      onClick={() => escolherDia(dia)}
                      className={`flex size-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
                        selecionado
                          ? "bg-brand-green font-bold text-white"
                          : ehHoje
                            ? "font-bold text-brand-green ring-1 ring-brand-green/40 hover:bg-brand-green-soft"
                            : doMes
                              ? "text-ink hover:bg-surface-hover"
                              : "text-ink-muted/50 hover:bg-surface-hover"
                      }`}
                    >
                      {dia.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                <button
                  type="button"
                  onClick={() => escolherDia(new Date())}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-green transition hover:bg-brand-green-soft"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setTexto("");
                    setAberto(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink"
                >
                  Limpar
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
