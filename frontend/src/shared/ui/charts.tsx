type Bar = { label: string; value: number };

export function BarChart({
  bars,
  accent = "green",
}: {
  bars: Bar[];
  accent?: "green" | "red";
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const fill = accent === "green" ? "#16a34a" : "#e31c24";

  return (
    <div className="flex h-[220px] items-end gap-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-[180px] w-full items-end justify-center">
            <div
              className="w-7 rounded-t-md sm:w-9"
              style={{ height: `${Math.max((bar.value / max) * 100, 4)}%`, background: fill }}
              title={`${bar.label}: ${bar.value}`}
            />
          </div>
          <span className="truncate text-[11px] font-medium text-ink-muted">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

type Slice = { label: string; value: number; color: string };

export function DonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  let cursor = 0;
  const gradient = slices
    .map((slice) => {
      const start = (cursor / total) * 100;
      cursor += slice.value;
      const end = (cursor / total) * 100;
      return `${slice.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div
        className="relative size-44 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Distribuição"
      >
        <div className="absolute inset-8 rounded-full bg-white" />
      </div>
      <ul className="space-y-2.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-ink-muted">
            <span className="size-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="font-medium text-ink">{Math.round((slice.value / total) * 100)}%</span>
            {slice.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreaChart({ points }: { points: number[] }) {
  const w = 640;
  const h = 220;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(max - min, 1);
  const coords = points.map((p, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * w;
    const y = h - ((p - min) / span) * (h - 24) - 8;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full" aria-hidden>
      <defs>
        <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1="0"
          x2={w}
          y1={h * t}
          y2={h * t}
          stroke="#e6eeea"
          strokeDasharray="4 6"
        />
      ))}
      <polygon points={area} fill="url(#areaGreen)" />
      <polyline points={line} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
