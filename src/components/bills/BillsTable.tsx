import React, { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
  createColumnHelper, SortingState, ColumnFiltersState, FilterFn,
} from "@tanstack/react-table";
import { useSelector } from "react-redux";
import { Bill, BillFormValues } from "../../types/bill";
import { getCategoryColor } from "../../constants/categories";
import { Category, PayChannel } from "../../types/catalog";
import { useEmojiMap } from "../../hooks/useEmojiMap";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
}
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
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const typeBadge = (type: string) => {
  const isCredit = type === "Crédito";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isCredit ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
    }`}>
      {type}
    </span>
  );
};

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const BillsTable = ({ data, loading, onUpdate, onDelete }: BillsTableProps) => {
  const { categories } = useSelector((state: { catalog: CatalogState }) => state.catalog);
  const expenseCategories = categories.filter((c) => c.type === "gasto");
  const emojiMap = useEmojiMap();

  const [sorting, setSorting]             = useState<SortingState>([{ id: "date", desc: true }]);
  const [globalFilter, setGlobalFilter]   = useState("");
  const [showFilters, setShowFilters]     = useState(false);
  const [filterCategory, setFilterCategory]   = useState("");
  const [filterType, setFilterType]           = useState("");
  const [filterPaymethod, setFilterPaymethod] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [deleteTarget, setDeleteTarget]   = useState<Bill | null>(null);
  const [editTarget, setEditTarget]       = useState<Bill | null>(null);

  const paymethods = useMemo(
    () => [...new Set(data.map((b) => b.paymethod).filter(Boolean))].sort(), [data]
  );

  const columnFilters = useMemo((): ColumnFiltersState => {
    const f: ColumnFiltersState = [];
    if (filterCategory)  f.push({ id: "category",  value: filterCategory });
    if (filterType)      f.push({ id: "type",       value: filterType });
    if (filterPaymethod) f.push({ id: "paymethod",  value: filterPaymethod });
    if (filterAmountMin || filterAmountMax)
      f.push({ id: "amount", value: [Number(filterAmountMin) || 0, Number(filterAmountMax) || 0] });
    return f;
  }, [filterCategory, filterType, filterPaymethod, filterAmountMin, filterAmountMax]);

  const activeFilterCount = [filterCategory, filterType, filterPaymethod, filterAmountMin || filterAmountMax].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory(""); setFilterType(""); setFilterPaymethod("");
    setFilterAmountMin(""); setFilterAmountMax("");
  };

  const columns = useMemo(() => [
    columnHelper.accessor("date", {
      header: "Fecha",
      cell: (info) => <span className="text-slate-500 text-xs font-mono">{info.getValue()}</span>,
      size: 100,
    }),
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => <span className="font-medium text-slate-100 text-sm">{capitalize(info.getValue())}</span>,
      size: 200,
    }),
    columnHelper.accessor("category", {
      header: "Categoría",
      filterFn: "equals",
      cell: (info) => {
        const cat = info.getValue();
        const color = getCategoryColor(cat);
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: `${color}20`, color }}>
            {emojiMap[cat]
              ? <span className="text-sm leading-none">{emojiMap[cat]}</span>
              : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            }
            {cat}
          </span>
        );
      },
      size: 150,
    }),
    columnHelper.accessor("detail", {
      header: "Detalle",
      cell: (info) => (
        <span className="text-slate-500 text-sm truncate block max-w-xs">{capitalize(info.getValue())}</span>
      ),
      size: 200,
    }),
    columnHelper.accessor("amount", {
      header: "Monto",
      filterFn: amountRangeFilter,
      cell: (info) => <span className="font-semibold text-slate-100 text-sm tabular-nums">{formatCurrency(info.getValue())}</span>,
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
      cell: (info) => <span className="text-slate-400 text-sm">{info.getValue()}</span>,
      size: 130,
    }),
    columnHelper.accessor("dues", {
      header: "Cuotas",
      cell: (info) => {
        const v = info.getValue();
        return v
          ? <span className="text-slate-400 text-sm">{v}</span>
          : <span className="text-slate-700 text-xs">—</span>;
      },
      size: 70,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setEditTarget(row.original)}
            className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Editar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
      size: 80,
    }),
  ], [emojiMap]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data, columns,
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

  const totalAmount  = data.reduce((sum, b) => sum + (b.amount || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthAmount  = data.filter((b) => b.date?.startsWith(currentMonth)).reduce((sum, b) => sum + (b.amount || 0), 0);

  const exportCsv = () => {
    const headers = ["Fecha","Nombre","Categoría","Detalle","Monto","Tipo","Método","Cuotas"];
    const rows = data.map((b) => [b.date, b.name, b.category, b.detail, b.amount, b.type, b.paymethod, b.dues ?? ""]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-800 rounded-t-xl overflow-hidden border-b border-slate-800">
          <div className="bg-slate-900 px-5 py-3">
            <p className="text-xs text-slate-500 font-medium">Total registros</p>
            <p className="text-lg font-bold text-slate-100">{data.length}</p>
          </div>
          <div className="bg-slate-900 px-5 py-3">
            <p className="text-xs text-slate-500 font-medium">Este mes</p>
            <p className="text-lg font-bold text-indigo-400">{formatCurrency(monthAmount)}</p>
          </div>
          <div className="bg-slate-900 px-5 py-3 hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">Total histórico</p>
            <p className="text-lg font-bold text-slate-100">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500/10 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-200">Registro de gastos</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56 transition-colors" />
            </div>
            <button onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                showFilters || activeFilterCount > 0
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/40">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-sm border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Todas</option>
                  {expenseCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</label>
                <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                  {(["", "Contado", "Crédito"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setFilterType(t)}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        filterType === t ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}>
                      {t === "" ? "Todos" : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Método</label>
                <select value={filterPaymethod} onChange={(e) => setFilterPaymethod(e.target.value)}
                  className="text-sm border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Todos</option>
                  {paymethods.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto</label>
                <div className="flex items-center gap-2">
                  {[{ v: filterAmountMin, set: setFilterAmountMin, ph: "Mínimo" }, { v: filterAmountMax, set: setFilterAmountMax, ph: "Máximo" }].map(({ v, set, ph }) => (
                    <div key={ph} className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                      <input type="number" min="0" placeholder={ph} value={v} onChange={(e) => set(e.target.value)}
                        className="pl-6 pr-2 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />
                    </div>
                  ))}
                  <span className="text-slate-600 text-sm">—</span>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors self-end">
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
                  <tr key={hg.id} className="border-b border-slate-800 bg-slate-800/50">
                    {hg.headers.map((header) => (
                      <th key={header.id}
                        className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap select-none"
                        style={{ width: header.getSize() }}>
                        {header.column.getCanSort() ? (
                          <button onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="text-slate-700">
                              {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? "↕"}
                            </span>
                          </button>
                        ) : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16 text-slate-600 text-sm">
                      {globalFilter ? "No se encontraron resultados" : "No hay gastos registrados"}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, i) => (
                    <tr key={row.id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${
                        i % 2 === 0 ? "" : "bg-slate-800/20"
                      }`}>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-800">
            <span className="text-sm text-slate-500">
              Mostrando{" "}
              <span className="font-medium text-slate-300">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                {" – "}
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
              </span>{" "}de{" "}
              <span className="font-medium text-slate-300">{table.getFilteredRowModel().rows.length}</span>{" "}registros
            </span>
            <div className="flex items-center gap-1">
              {[
                { fn: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage(), icon: "M11 19l-7-7 7-7m8 14l-7-7 7-7" },
                { fn: () => table.previousPage(), disabled: !table.getCanPreviousPage(), icon: "M15 19l-7-7 7-7" },
              ].map(({ fn, disabled, icon }, i) => (
                <button key={i} onClick={fn} disabled={disabled}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </button>
              ))}
              <span className="px-3 py-1 text-sm text-slate-400 font-medium">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              {[
                { fn: () => table.nextPage(), disabled: !table.getCanNextPage(), icon: "M9 5l7 7-7 7" },
                { fn: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage(), icon: "M13 5l7 7-7 7M5 5l7 7-7 7" },
              ].map(({ fn, disabled, icon }, i) => (
                <button key={i} onClick={fn} disabled={disabled}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </button>
              ))}
              <select value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="ml-2 text-sm border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[10, 15, 25, 50].map((s) => <option key={s} value={s}>{s} / página</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget} billName={deleteTarget?.name ?? ""}
        onConfirm={async () => { if (deleteTarget) { await onDelete(deleteTarget._id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
      <EditBillModal bill={editTarget} onSave={onUpdate} onClose={() => setEditTarget(null)} />
    </>
  );
};

export default BillsTable;
