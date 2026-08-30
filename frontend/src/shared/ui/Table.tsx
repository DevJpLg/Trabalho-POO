import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Alinha a coluna à direita — usado na de ações. */
  fim?: boolean;
  /** Largura fixa (ex.: coluna de ID). As demais dividem o espaço restante. */
  largura?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  /** Estado vazio completo (ícone, título, ação). Tem prioridade sobre `emptyMessage`. */
  empty?: ReactNode;
  footer?: ReactNode;
  /** Clique na linha (ex.: abrir detalhes). Os botões da coluna de ações não disparam isso. */
  onRowClick?: (row: T) => void;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro.",
  empty,
  footer,
  onRowClick,
}: Props<T>) {
  if (rows.length === 0) {
    if (empty) return <>{empty}</>;
    return (
      <div className="rounded-[15px] bg-surface px-6 py-16 text-center text-sm text-ink-muted shadow-card ring-1 ring-line/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[15px] bg-surface shadow-card ring-1 ring-line/60">
      <table className="w-full table-fixed text-left text-[13px]">
        <colgroup>
          {columns.map((col) => (
            <col
              key={col.key}
              style={{
                width:
                  col.largura ??
                  (col.key === "id" ? "3.25rem" : undefined),
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-line bg-surface-muted/60 text-[11px] uppercase tracking-wide text-ink-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 font-semibold ${
                  col.key === "id" ? "px-2 pl-3" : "px-2.5 first:pl-4 last:pr-4"
                } ${col.fim ? "text-right" : ""} ${col.className ?? ""}`}
              >
                <span className="block truncate">{col.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-line/60 transition-colors last:border-0 hover:bg-surface-hover/60 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 align-middle text-ink ${
                    col.key === "id" ? "px-2 pl-3 tabular-nums" : "px-2.5 first:pl-4 last:pr-4"
                  } ${col.fim ? "text-right" : ""} ${col.className ?? ""}`}
                  onClick={
                    onRowClick && !col.fim
                      ? () => onRowClick(row)
                      : undefined
                  }
                >
                  <div className={col.fim ? "min-w-0" : "min-w-0 overflow-hidden"}>
                    {col.render(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer ? (
        <div className="border-t border-line bg-surface-muted/60 px-4 py-3 text-sm font-semibold text-brand-red">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Agrupa botões de ícone no fim da linha, sem forçar largura extra na tabela. */
export function RowActions({ children }: { children: ReactNode }) {
  function parar(evento: { stopPropagation: () => void }) {
    evento.stopPropagation();
  }
  return (
    <div
      className="flex flex-nowrap items-center justify-end gap-0.5"
      onPointerDown={parar}
      onClick={parar}
    >
      {children}
    </div>
  );
}
