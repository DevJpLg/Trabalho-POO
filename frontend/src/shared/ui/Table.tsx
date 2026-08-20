import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  footer?: ReactNode;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro.",
  footer,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[25px] bg-white px-6 py-16 text-center text-sm text-ink-muted shadow-[0_8px_30px_rgba(26,46,37,0.04)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[25px] bg-white shadow-[0_8px_30px_rgba(26,46,37,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-[13px] font-medium text-ink-muted">
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-5 font-medium ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-line/80">
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-5 align-middle text-ink ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-line px-6 py-4 text-sm font-semibold text-brand-red">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
