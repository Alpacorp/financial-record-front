import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Bill } from "../types/bill";
import { getCategoryColor } from "../constants/categories";
import { useEmojiMap } from "../hooks/useEmojiMap";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const parseLocal = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const ymFromNow = (offset: number): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const ymLabel = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
};

const spendingByCategory = (bills: Bill[]): Record<string, number> => {
  const m: Record<string, number> = {};
  bills.forEach((b) => { if (b.category) m[b.category] = (m[b.category] ?? 0) + (b.amount ?? 0); });
  return m;
};

// ─── Credit projection builder ────────────────────────────────────────────────

interface ProjectionMonth {
  ym: string;
  label: string;
  total: number;
  items: { name: string; amount: number; color: string }[];
}

const buildProjection = (bills: Bill[], horizonMonths: number): ProjectionMonth[] => {
  const now      = new Date();
  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth();

  type Entry = { name: string; amount: number; color: string; ym: string };
  const entries: Entry[] = [];

  for (const bill of bills) {
    if (bill.type !== "Crédito" || !bill.dues || bill.dues <= 0 || !bill.date) continue;
    const purchase   = parseLocal(bill.date);
    const monthsDiff = (nowYear - purchase.getFullYear()) * 12 + (nowMonth - purchase.getMonth());
    const paidDues   = Math.min(Math.max(0, monthsDiff), bill.dues);
    const remaining  = bill.dues - paidDues;
    if (remaining <= 0) continue;

    const monthly = bill.amount / bill.dues;
    const color   = getCategoryColor(bill.category);

    for (let i = 0; i < remaining; i++) {
      const due = new Date(purchase.getFullYear(), purchase.getMonth() + paidDues + i, 1);
      const ym  = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`;
      entries.push({ name: bill.name, amount: monthly, color, ym });
    }
  }

  const result: ProjectionMonth[] = [];
  for (let i = 0; i < horizonMonths; i++) {
    const d     = new Date(nowYear, nowMonth + i, 1);
    const ym    = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    const items = entries.filter((e) => e.ym === ym).sort((a, b) => b.amount - a.amount);
    if (items.length > 0) {
      result.push({ ym, label, total: items.reduce((s, e) => s + e.amount, 0), items });
    }
  }
  return result;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortBy = "delta" | "a" | "b" | "alpha";

const Analisis = () => {
  const { data: bills, status } = useSelector((state: { bills: BillsState }) => state.bills);
  const emojiMap = useEmojiMap();

  const [periodA, setPeriodA] = useState(ymFromNow(-1));
  const [periodB, setPeriodB] = useState(ymFromNow(0));
  const [sortBy,  setSortBy]  = useState<SortBy>("delta");

  const billsA = useMemo(() => bills.filter((b) => b.date?.startsWith(periodA)), [bills, periodA]);
  const billsB = useMemo(() => bills.filter((b) => b.date?.startsWith(periodB)), [bills, periodB]);

  const mapA = useMemo(() => spendingByCategory(billsA), [billsA]);
  const mapB = useMemo(() => spendingByCategory(billsB), [billsB]);

  const totalA     = Object.values(mapA).reduce((s, v) => s + v, 0);
  const totalB     = Object.values(mapB).reduce((s, v) => s + v, 0);
  const totalDelta = totalB - totalA;
  const totalPct   = totalA > 0 ? ((totalB - totalA) / totalA) * 100 : null;

  const categories = useMemo(() => {
    const cats = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
    let list = Array.from(cats).map((cat) => {
      const a   = mapA[cat] ?? 0;
      const b   = mapB[cat] ?? 0;
      const delta = b - a;
      const pct   = a > 0 ? ((b - a) / a) * 100 : null;
      return { cat, a, b, delta, pct };
    });

    if      (sortBy === "delta") list.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
    else if (sortBy === "a")     list.sort((x, y) => y.a - x.a);
    else if (sortBy === "b")     list.sort((x, y) => y.b - x.b);
    else if (sortBy === "alpha") list.sort((x, y) => x.cat.localeCompare(y.cat, "es"));
    return list;
  }, [mapA, mapB, sortBy]);

  const maxAmount = useMemo(
    () => Math.max(...categories.map((c) => Math.max(c.a, c.b)), 1),
    [categories]
  );

  const projection = useMemo(() => buildProjection(bills, 12), [bills]);
  const maxMonthTotal = useMemo(
    () => Math.max(...projection.map((m) => m.total), 1),
    [projection]
  );

  const loading = status === "idle" || status === "checking";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ══ Sección 1: Comparador ══ */}
      <section className="space-y-4">
        <div>
          <h1 className="text-base font-semibold text-slate-100">Comparador de períodos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Selecciona dos meses y compara tus gastos por categoría</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Período A</label>
              <input type="month" value={periodA} onChange={(e) => setPeriodA(e.target.value)}
                className="text-sm border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center pb-2.5 text-slate-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Período B</label>
              <input type="month" value={periodB} onChange={(e) => setPeriodB(e.target.value)}
                className="text-sm border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="sm:ml-auto">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Ordenar por</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-sm border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                <option value="delta">Mayor diferencia</option>
                <option value="a">Mayor gasto en A</option>
                <option value="b">Mayor gasto en B</option>
                <option value="alpha">Alfabético</option>
              </select>
            </div>
          </div>

          {/* Summary totals */}
          <div className="grid grid-cols-3 gap-px bg-slate-800 rounded-xl overflow-hidden mt-5">
            <div className="bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate capitalize">{ymLabel(periodA)}</p>
              <p className="text-lg sm:text-xl font-bold text-slate-100 tabular-nums mt-0.5 truncate">{formatCOP(totalA)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{billsA.length} registros</p>
            </div>
            <div className="bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate capitalize">{ymLabel(periodB)}</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums mt-0.5 truncate">{formatCOP(totalB)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{billsB.length} registros</p>
            </div>
            <div className="bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Diferencia</p>
              <p className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 truncate ${
                totalDelta > 0 ? "text-red-400" : totalDelta < 0 ? "text-emerald-400" : "text-slate-400"
              }`}>
                {totalDelta > 0 ? "+" : ""}{formatCOP(totalDelta)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {totalPct !== null ? `${totalPct > 0 ? "▲" : "▼"} ${Math.abs(totalPct).toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Category table */}
        {categories.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 text-center text-sm text-slate-600">
            No hay datos en ninguno de los dos períodos seleccionados.
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_160px_160px_110px] gap-3 px-5 py-3 border-b border-slate-800 bg-slate-800/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide capitalize truncate">{ymLabel(periodA)}</span>
                  <span className="text-xs font-semibold text-indigo-500/70 uppercase tracking-wide capitalize truncate">{ymLabel(periodB)}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Variación</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-800">
                  {categories.map(({ cat, a, b, delta, pct }) => {
                    const color = getCategoryColor(cat);
                    const emoji = emojiMap[cat];
                    const isNew  = a === 0 && b > 0;
                    const isGone = a > 0 && b === 0;
                    return (
                      <div key={cat} className="grid grid-cols-[1fr_160px_160px_110px] gap-3 px-5 py-3.5 items-center hover:bg-slate-800/30 transition-colors">
                        {/* Category name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm text-slate-200 font-medium truncate">
                            {emoji ? `${emoji} ` : ""}{cat}
                          </span>
                        </div>

                        {/* Period A bar */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-400 tabular-nums mb-1">
                            {a > 0 ? formatCOP(a) : <span className="text-slate-700 text-xs">—</span>}
                          </p>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(a / maxAmount) * 100}%`, backgroundColor: color, opacity: 0.5 }} />
                          </div>
                        </div>

                        {/* Period B bar */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 tabular-nums mb-1">
                            {b > 0 ? formatCOP(b) : <span className="text-slate-700 text-xs">—</span>}
                          </p>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(b / maxAmount) * 100}%`, backgroundColor: color }} />
                          </div>
                        </div>

                        {/* Delta */}
                        <div className="text-right">
                          {isNew ? (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Nuevo</span>
                          ) : isGone ? (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Sin gasto</span>
                          ) : delta === 0 ? (
                            <span className="text-xs text-slate-600">Sin cambio</span>
                          ) : (
                            <>
                              <p className={`text-sm font-semibold tabular-nums ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                {delta > 0 ? "+" : ""}{formatCOP(delta)}
                              </p>
                              {pct !== null && (
                                <p className={`text-xs mt-0.5 ${delta > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                  {delta > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total footer */}
                <div className="grid grid-cols-[1fr_160px_160px_110px] gap-3 px-5 py-3 border-t border-slate-800 bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide self-center">Total</span>
                  <span className="text-sm font-bold text-slate-300 tabular-nums">{formatCOP(totalA)}</span>
                  <span className="text-sm font-bold text-indigo-400 tabular-nums">{formatCOP(totalB)}</span>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${totalDelta > 0 ? "text-red-400" : totalDelta < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                      {totalDelta > 0 ? "+" : ""}{formatCOP(totalDelta)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══ Sección 2: Gastos comprometidos ══ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Gastos comprometidos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cuotas de créditos activos proyectadas mes a mes</p>
        </div>

        {projection.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 text-center text-sm text-slate-600">
            No hay créditos activos con cuotas pendientes.
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="divide-y divide-slate-800">
              {projection.map((month, idx) => {
                const isCurrentMonth = idx === 0 && month.ym === ymFromNow(0);
                return (
                  <div key={month.ym} className={`px-5 py-4 hover:bg-slate-800/30 transition-colors ${isCurrentMonth ? "bg-amber-500/5" : ""}`}>
                    <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3">
                      {/* Month label */}
                      <div className="w-full sm:w-32 flex-shrink-0 flex items-center gap-2">
                        {isCurrentMonth && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        )}
                        <p className="text-sm font-semibold text-slate-100 capitalize">{month.label}</p>
                      </div>

                      {/* Credits chips + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {month.items.map((item, i) => (
                            <span key={i}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium"
                              style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                              <span className="truncate max-w-[120px]">{item.name}</span>
                              <span className="font-semibold flex-shrink-0 opacity-80">{formatCOP(item.amount)}</span>
                            </span>
                          ))}
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(month.total / maxMonthTotal) * 100}%`,
                              backgroundColor: isCurrentMonth ? "#f59e0b" : "#6366f1",
                            }} />
                        </div>
                      </div>

                      {/* Total */}
                      <div className="w-full sm:w-32 sm:text-right flex-shrink-0 flex sm:block items-center justify-between sm:justify-end">
                        <p className={`text-sm font-bold tabular-nums ${isCurrentMonth ? "text-amber-400" : "text-slate-100"}`}>
                          {formatCOP(month.total)}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {month.items.length} crédito{month.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer summary */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/30 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                {projection.length} mes{projection.length !== 1 ? "es" : ""} con compromisos ·{" "}
                promedio {formatCOP(projection.reduce((s, m) => s + m.total, 0) / projection.length)}/mes
              </span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                Total comprometido: {formatCOP(projection.reduce((s, m) => s + m.total, 0))}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analisis;
