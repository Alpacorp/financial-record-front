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
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table";
import { Bill, BillFormValues } from "../../types/bill";
import { EXPENSE_CATEGORIES, getCategoryColor } from "../../constants/categories";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import EditBillModal from "./EditBillModal";

interface BillsTableProps {
  data: Bill[];
  loading: boolean;
  onUpdate: (id: string, values: BillFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const columnHelper = createColumnHelper<Bill>();

const amountRangeFilter: FilterFn<Bill> = (row, _id, [min, max]: [number, number]) => {
  const v = row.getValue<number>("amount");
  if (min > 0 && v < min) return false;
  if (max > 0 && v > max) return false;
  return true;
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory,   setFilterCategory]   = useState("");
  const [filterType,       setFilterType]        = useState("");
  const [filterPaymethod,  setFilterPaymethod]   = useState("");
  const [filterAmountMin,  setFilterAmountMin]   = useState("");
  const [filterAmountMax,  setFilterAmountMax]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [editTarget, setEditTarget] = useState<Bill | null>(null);

  // Unique paymethods present in data
  const paymethods = useMemo(
    () => [...new Set(data.map((b) => b.paymethod).filter(Boolean))].sort(),
    [data]
  );

  // Build TanStack columnFilters from local state
  const columnFilters = useMemo((): ColumnFiltersState => {
    const f: ColumnFiltersState = [];
    if (filterCategory)  f.push({ id: "category",  value: filterCategory });
    if (filterType)      f.push({ id: "type",       value: filterType });
    if (filterPaymethod) f.push({ id: "paymethod",  value: filterPaymethod });
    if (filterAmountMin || filterAmountMax)
      f.push({ id: "amount", value: [Number(filterAmountMin) || 0, Number(filterAmountMax) || 0] });
    return f;
  }, [filterCategory, filterType, filterPaymethod, filterAmountMin, filterAmountMax]);

  const activeFilterCount = [filterCategory, filterType, filterPaymethod, filterAmountMin || filterAmountMax]
    .filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory("");
    setFilterType("");
    setFilterPaymethod("");
    setFilterAmountMin("");
    setFilterAmountMax("");
  };

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
        filterFn: "equals",
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
        filterFn: amountRangeFilter,
        cell: (info) => (
          <span className="font-semibold text-gray-900 text-sm tabular-nums">
            {formatCurrency(info.getValue())}
          </span>
        ),
        size: 130,
      }),
      columnHelper.accessor("type", {
        header: "Tipo",
        filterFn: "equals",
        cell: (info) => typeBadge(info.getValue()),
        size: 90,
      }),
      columnHelper.accessor("paymethod", {
        header: "Método",
        filterFn: "equals",
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
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: () => { /* controlled externally */ },
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
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                showFilters || activeFilterCount > 0
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
              title="Filtros"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
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

        {/* Filter panel */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex flex-wrap gap-3 items-end">

              {/* Categoría */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                  {(["", "Contado", "Crédito"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        filterType === t
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {t === "" ? "Todos" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Método */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Método</label>
                <select
                  value={filterPaymethod}
                  onChange={(e) => setFilterPaymethod(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos</option>
                  {paymethods.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Monto rango */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Mínimo"
                      value={filterAmountMin}
                      onChange={(e) => setFilterAmountMin(e.target.value)}
                      className="pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                    />
                  </div>
                  <span className="text-gray-400 text-sm">—</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Máximo"
                      value={filterAmountMax}
                      onChange={(e) => setFilterAmountMax(e.target.value)}
                      className="pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Limpiar */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors self-end"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

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
