import React from "react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucune donnée à afficher",
  actions,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded shadow bg-white">
      <table className="min-w-full border border-black">
        <thead className="bg-white">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-black"
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 border-b border-black">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-black">
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-violet-300" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  Chargement…
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-black">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id}
                className={
                  i % 2 === 0
                    ? "bg-white hover:bg-violet-50 transition-colors"
                    : "bg-white hover:bg-violet-50 transition-colors"
                }
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm text-black whitespace-nowrap border-b border-black">
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 border-b border-black">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 