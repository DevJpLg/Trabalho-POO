import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Alinha a coluna à direita — usado na de ações. */
  fim?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  /** Estado vazio completo (ícone, título, ação). Tem prioridade sobre `emptyMessage`. */
  empty?: ReactNode;
  footer?: ReactNode;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro.",
  empty,
  footer,
}: Props<T>) {
  if (rows.length === 0) {
    if (empty) return <>{empty}</>;
    return (
      <div className="rounded-[25px] bg-surface px-6 py-16 text-center text-sm text-ink-muted shadow-card ring-1 ring-line/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[25px] bg-surface shadow-card ring-1 ring-line/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted/60 text-[12px] uppercase tracking-wide text-ink-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3.5 font-semibold ${col.fim ? "text-right" : ""} ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-hover/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 align-middle text-ink ${col.fim ? "text-right" : ""} ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-line bg-surface-muted/60 px-6 py-4 text-sm font-semibold text-brand-red">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Agrupa botões de ícone no fim da linha, sem quebrar em várias fileiras. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>;
}
