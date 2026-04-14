import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { Bill, BillFormValues } from "../../types/bill";
import { getCategoryColor } from "../../constants/categories";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import EditBillModal from "./EditBillModal";

interface BillsTableProps {
  data: Bill[];
  loading: boolean;
  onUpdate: (id: string, values: BillFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const columnHelper = createColumnHelper<Bill>();

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const typeBadge = (type: string) => {
  const isCredit = type === "Crédito";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isCredit
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {type}
    </span>
  );
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const BillsTable = ({ data, loading, onUpdate, onDelete }: BillsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [editTarget, setEditTarget] = useState<Bill | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: "Fecha",
        cell: (info) => (
          <span className="text-gray-600 text-xs font-mono">{info.getValue()}</span>
        ),
        size: 100,
      }),
      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => (
          <span className="font-medium text-gray-900 text-sm" title={info.getValue()}>
            {capitalize(info.getValue())}
          </span>
        ),
        size: 200,
      }),
      columnHelper.accessor("category", {
        header: "Categoría",
        cell: (info) => {
          const cat = info.getValue();
          const color = getCategoryColor(cat);
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: `${color}18`,
                color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {cat}
            </span>
          );
        },
        size: 150,
      }),
      columnHelper.accessor("detail", {
        header: "Detalle",
        cell: (info) => (
          <span className="text-gray-500 text-sm truncate block max-w-xs" title={info.getValue()}>
            {capitalize(info.getValue())}
          </span>
        ),
        size: 200,
      }),
      columnHelper.accessor("amount", {
        header: "Monto",
        cell: (info) => (
          <span className="font-semibold text-gray-900 text-sm tabular-nums">
            {formatCurrency(info.getValue())}
          </span>
        ),
        size: 130,
      }),
      columnHelper.accessor("type", {
        header: "Tipo",
        cell: (info) => typeBadge(info.getValue()),
        size: 90,
      }),
      columnHelper.accessor("paymethod", {
        header: "Método",
        cell: (info) => (
          <span className="text-gray-600 text-sm">{info.getValue()}</span>
        ),
        size: 130,
      }),
      columnHelper.accessor("dues", {
        header: "Cuotas",
        cell: (info) => {
          const v = info.getValue();
          return v ? (
            <span className="text-gray-600 text-sm">{v}</span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          );
        },
        size: 70,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditTarget(row.original)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        size: 80,
      }),
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  // Summary stats
  const totalAmount = data.reduce((sum, b) => sum + (b.amount || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthAmount = data
    .filter((b) => b.date?.startsWith(currentMonth))
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const exportCsv = () => {
    const headers = ["Fecha", "Nombre", "Categoría", "Detalle", "Monto", "Tipo", "Método", "Cuotas"];
    const rows = data.map((b) => [
      b.date, b.name, b.category, b.detail, b.amount, b.type, b.paymethod, b.dues ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100 rounded-t-xl overflow-hidden border-b border-gray-200">
          <div className="bg-white px-5 py-3">
            <p className="text-xs text-gray-500 font-medium">Total registros</p>
            <p className="text-lg font-bold text-gray-900">{data.length}</p>
          </div>
          <div className="bg-white px-5 py-3">
            <p className="text-xs text-gray-500 font-medium">Este mes</p>
            <p className="text-lg font-bold text-indigo-600">{formatCurrency(monthAmount)}</p>
          </div>
          <div className="bg-white px-5 py-3 hidden sm:block">
            <p className="text-xs text-gray-500 font-medium">Total histórico</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-50 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">Registro de gastos</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-full sm:w-56 transition-colors"
              />
            </div>
            {/* Export */}
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              title="Exportar CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-gray-100 bg-gray-50">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none"
                        style={{ width: header.getSize() }}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="text-gray-300">
                              {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? "↕"}
                            </span>
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16 text-gray-400 text-sm">
                      {globalFilter ? "No se encontraron resultados" : "No hay gastos registrados"}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? "" : "bg-gray-50/50"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Mostrando{" "}
              <span className="font-medium text-gray-700">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                {" – "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{" "}
              de{" "}
              <span className="font-medium text-gray-700">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              registros
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1 text-sm text-gray-700 font-medium">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>

              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="ml-2 text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[10, 15, 25, 50].map((s) => (
                  <option key={s} value={s}>{s} / página</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        billName={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDelete(deleteTarget._id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <EditBillModal
        bill={editTarget}
        onSave={onUpdate}
        onClose={() => setEditTarget(null)}
      />
    </>
  );
};

export default BillsTable;
