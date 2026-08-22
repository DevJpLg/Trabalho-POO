import { useState, type ReactNode } from "react";

/*
 * Gráficos em SVG/CSS puro, sem biblioteca externa.
 *
 * As cores saem dos tokens `--color-chart-*`, então o tema escuro é
 * acompanhado sem nenhuma lógica de tema aqui dentro.
 */

const CINZA_GRADE = "var(--color-chart-grid)";
const VERDE = "var(--color-chart-primary)";
const VERDE_CLARO = "var(--color-chart-secondary)";
const VERMELHO = "var(--color-chart-danger)";

function Tooltip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-canvas shadow-pop animate-surgir"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}

/**
 * Escala com passos redondos mirando ~4 divisões, sem sobrar altura à toa:
 * para um máximo de 120 o topo vira 150 (e não 400, como um passo fixo daria).
 */
function escala(maximo: number): { topo: number; marcas: number[] } {
  if (maximo <= 0) return { topo: 4, marcas: [0, 1, 2, 3, 4] };

  const alvo = maximo / 4;
  const magnitude = 10 ** Math.floor(Math.log10(alvo));
  const passo =
    [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= alvo) ?? magnitude * 10;

  const divisoes = Math.ceil(maximo / passo);
  const topo = passo * divisoes;
  const marcas = Array.from({ length: divisoes + 1 }, (_, indice) =>
    Number((passo * indice).toFixed(2)),
  );

  return { topo, marcas };
}

/* ========================= barras ========================= */

type Bar = { label: string; value: number };

export function BarChart({ bars, accent = "green" }: { bars: Bar[]; accent?: "green" | "red" }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const cor = accent === "green" ? VERDE : VERMELHO;
  const { topo, marcas } = escala(Math.max(...bars.map((b) => b.value), 0));

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* eixo de valores */}
        <div className="flex h-[190px] w-9 shrink-0 flex-col-reverse justify-between text-right text-[11px] font-medium text-ink-muted">
          {marcas.map((marca) => (
            <span key={marca}>{marca}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* linhas de grade */}
          <div className="absolute inset-0 flex h-[190px] flex-col-reverse justify-between">
            {marcas.map((marca) => (
              <span key={marca} className="h-px w-full" style={{ background: CINZA_GRADE }} />
            ))}
          </div>

          <div className="relative flex h-[190px] min-w-0 items-end gap-1.5 sm:gap-2.5">
            {bars.map((bar, indice) => {
              const altura = topo === 0 ? 0 : (bar.value / topo) * 100;
              return (
                <div
                  key={`${bar.label}-${indice}`}
                  className="flex h-full min-w-0 flex-1 items-end justify-center"
                  onMouseEnter={() => setAtivo(indice)}
                  onMouseLeave={() => setAtivo(null)}
                >
                  <div
                    className="w-full max-w-9 origin-bottom rounded-t-lg transition-opacity duration-150 animate-crescer"
                    style={{
                      height: `${Math.max(altura, bar.value > 0 ? 2 : 0)}%`,
                      background: `linear-gradient(180deg, ${cor} 0%, color-mix(in srgb, ${cor} 62%, transparent) 100%)`,
                      opacity: ativo === null || ativo === indice ? 1 : 0.4,
                      animationDelay: `${indice * 45}ms`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* rótulos */}
          <div className="mt-2 flex min-w-0 gap-1.5 sm:gap-2.5">
            {bars.map((bar, indice) => (
              <span
                key={`${bar.label}-rotulo-${indice}`}
                className={`min-w-0 flex-1 truncate text-center text-[11px] font-medium transition-colors ${
                  ativo === indice ? "text-ink" : "text-ink-muted"
                }`}
              >
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {ativo !== null && bars[ativo] ? (
        <Tooltip x={((ativo + 0.5) / bars.length) * 100} y={-2}>
          {bars[ativo].label}: {bars[ativo].value}
        </Tooltip>
      ) : null}
    </div>
  );
}

/* ========================= rosca ========================= */

type Slice = { label: string; value: number; color?: string };

export function DonutChart({ slices, total: rotuloTotal }: { slices: Slice[]; total?: string }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const paleta = [VERDE, VERDE_CLARO, VERMELHO];
  const fatias = slices.map((fatia, indice) => ({
    ...fatia,
    color: fatia.color ?? paleta[indice % paleta.length],
  }));

  const total = fatias.reduce((soma, fatia) => soma + fatia.value, 0) || 1;
  let cursor = 0;
  const gradiente = fatias
    .map((fatia, indice) => {
      const inicio = (cursor / total) * 100;
      cursor += fatia.value;
      const fim = (cursor / total) * 100;
      const cor =
        ativo === null || ativo === indice
          ? fatia.color
          : `color-mix(in srgb, ${fatia.color} 35%, transparent)`;
      return `${cor} ${inicio}% ${fim}%`;
    })
    .join(", ");

  const somaReal = fatias.reduce((soma, fatia) => soma + fatia.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        className="relative size-40 shrink-0 rounded-full transition-all duration-200 sm:size-44"
        style={{ background: `conic-gradient(${gradiente})` }}
        role="img"
        aria-label="Distribuição por classificação"
      >
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-2xl font-bold leading-none text-ink">
            {ativo === null ? somaReal : fatias[ativo].value}
          </span>
          <span className="mt-1 max-w-20 truncate text-[11px] font-medium text-ink-muted">
            {ativo === null ? (rotuloTotal ?? "total") : fatias[ativo].label}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-1">
        {fatias.map((fatia, indice) => (
          <li key={fatia.label}>
            <button
              type="button"
              onMouseEnter={() => setAtivo(indice)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(indice)}
              onBlur={() => setAtivo(null)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: fatia.color }} />
              <span className="min-w-0 flex-1 truncate text-ink-muted">{fatia.label}</span>
              <span className="shrink-0 font-semibold text-ink">
                {Math.round((fatia.value / total) * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========================= área ========================= */

export function AreaChart({
  points,
  labels,
  formatar = (valor: number) => String(valor),
}: {
  points: number[];
  labels?: string[];
  formatar?: (valor: number) => string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);

  const largura = 640;
  const altura = 200;
  const margem = 10;

  const maximo = Math.max(...points, 1);
  const minimo = Math.min(...points, 0);
  const amplitude = Math.max(maximo - minimo, 1);

  const coordenada = (valor: number, indice: number) => {
    const x = (indice / Math.max(points.length - 1, 1)) * largura;
    const y = altura - ((valor - minimo) / amplitude) * (altura - margem * 2) - margem;
    return { x, y };
  };

  const pontos = points.map(coordenada);
  const linha = pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(" ");
  const area = `0,${altura} ${linha} ${largura},${altura}`;

  return (
    <div
      className="relative"
      onMouseLeave={() => setAtivo(null)}
      onMouseMove={(evento) => {
        const caixa = evento.currentTarget.getBoundingClientRect();
        const proporcao = (evento.clientX - caixa.left) / caixa.width;
        const indice = Math.round(proporcao * (points.length - 1));
        setAtivo(Math.min(Math.max(indice, 0), points.length - 1));
      }}
    >
      <svg viewBox={`0 0 ${largura} ${altura}`} className="h-[200px] w-full" aria-hidden>
        <defs>
          <linearGradient id="areaVerde" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VERDE} stopOpacity="0.3" />
            <stop offset="100%" stopColor={VERDE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fracao) => (
          <line
            key={fracao}
            x1="0"
            x2={largura}
            y1={altura * fracao}
            y2={altura * fracao}
            stroke={CINZA_GRADE}
            strokeDasharray={fracao === 1 ? undefined : "4 6"}
          />
        ))}

        <polygon points={area} fill="url(#areaVerde)" />
        <polyline
          points={linha}
          fill="none"
          stroke={VERDE}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="animate-tracar"
          style={{ strokeDasharray: 2000, "--comprimento": 2000 } as React.CSSProperties}
        />

        {ativo !== null && pontos[ativo] ? (
          <>
            <line
              x1={pontos[ativo].x}
              x2={pontos[ativo].x}
              y1="0"
              y2={altura}
              stroke={VERDE}
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
            <circle
              cx={pontos[ativo].x}
              cy={pontos[ativo].y}
              r="6"
              fill="var(--color-surface)"
              stroke={VERDE}
              strokeWidth="3"
            />
          </>
        ) : null}
      </svg>

      {labels && labels.length > 0 ? (
        <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-muted">
          {labels.map((rotulo, indice) => (
            <span
              key={`${rotulo}-${indice}`}
              className={`min-w-0 truncate ${ativo === indice ? "text-ink" : ""}`}
            >
              {rotulo}
            </span>
          ))}
        </div>
      ) : null}

      {ativo !== null ? (
        <Tooltip x={(ativo / Math.max(points.length - 1, 1)) * 100} y={-4}>
          {labels?.[ativo] ? `${labels[ativo]}: ` : ""}
          {formatar(points[ativo])}
        </Tooltip>
      ) : null}
    </div>
  );
}
