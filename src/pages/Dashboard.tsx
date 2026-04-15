import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
} from "recharts";
import {
  filterBillsByRange, getSpendingByCategory, getMonthlyTrend,
  getSummaryStats, getDataDateRange,
} from "../utils/billsAnalytics";
import { getCategoryColor } from "../constants/categories";
import { Bill } from "../types/bill";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const formatShort = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const firstOfMonth = (): string => today().slice(0, 7) + "-01";

const firstOfMonthOffset = (delta: number): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const parseLocal = (s: string): Date => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

type Preset = "month" | "3m" | "6m" | "year" | "all" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "month",  label: "Este mes" },
  { id: "3m",     label: "3 meses" },
  { id: "6m",     label: "6 meses" },
  { id: "year",   label: "Este año" },
  { id: "all",    label: "Todo" },
  { id: "custom", label: "Personalizado" },
];

// ─── Tooltips ────────────────────────────────────────────────────────────────

const BarTip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl px-3 py-2 text-sm">
      <p className="font-medium text-slate-400 mb-0.5">{label}</p>
      <p className="text-indigo-400 font-semibold">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

const PieTip = ({ active, payload }: {
  active?: boolean; payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl px-3 py-2 text-sm">
      <p className="font-medium text-slate-400 mb-0.5">{payload[0].name}</p>
      <p className="text-indigo-400 font-semibold">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 truncate ${accent ? "text-indigo-400" : "text-slate-100"}`}>{value}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

// ─── Category breakdown with drill-down ──────────────────────────────────────

const fmtDateShort = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

interface CategoryBreakdownProps {
  byCategory: { name: string; value: number; fill: string }[];
  filtered: Bill[];
  stats: { total: number; recordCount: number; topCategory?: { name: string; value: number } };
  rangeLabel: string;
}

const CategoryBreakdown = ({ byCategory, filtered, stats, rangeLabel }: CategoryBreakdownProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });

  const billsByCategory = useMemo(() => {
    const map: Record<string, Bill[]> = {};
    for (const cat of byCategory) {
      map[cat.name] = filtered
        .filter((b) => b.category === cat.name)
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    }
    return map;
  }, [byCategory, filtered]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Detalle por categoría</h2>
          <p className="text-xs text-slate-600 mt-0.5">Haz clic en una categoría para ver los registros</p>
        </div>
        <span className="text-xs text-slate-600 hidden sm:block">{rangeLabel}</span>
      </div>

      <div className="divide-y divide-slate-800">
        {byCategory.map((cat) => {
          const pct    = stats.total > 0 ? (cat.value / stats.total) * 100 : 0;
          const color  = cat.fill;
          const isOpen = expanded.has(cat.name);
          const bills  = billsByCategory[cat.name] ?? [];

          return (
            <div key={cat.name}>
              <button onClick={() => toggle(cat.name)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-800/50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-slate-300 flex-1 font-medium">{cat.name}</span>
                <span className="text-xs text-slate-600 tabular-nums hidden sm:block">
                  {bills.length} registro{bills.length !== 1 ? "s" : ""}
                </span>
                <div className="w-24 hidden sm:block">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
                <span className="text-xs text-slate-600 w-10 text-right hidden sm:block tabular-nums">{pct.toFixed(0)}%</span>
                <span className="text-sm font-semibold text-slate-100 tabular-nums w-28 text-right">{formatCOP(cat.value)}</span>
                <svg className={`w-4 h-4 text-slate-600 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="bg-slate-950/50 border-t border-slate-800">
                  <div className="px-5 py-2 grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_160px_auto_auto] gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wide border-b border-slate-800">
                    <span>Nombre</span>
                    <span className="hidden sm:block">Detalle</span>
                    <span className="text-right">Fecha</span>
                    <span className="text-right">Monto</span>
                  </div>
                  {bills.length === 0 ? (
                    <p className="text-sm text-slate-600 px-5 py-4">Sin registros en este período.</p>
                  ) : (
                    bills.map((bill) => (
                      <div key={bill._id}
                        className="px-5 py-2.5 grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_160px_auto_auto] gap-4 items-center border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <span className="text-sm text-slate-300 truncate">
                          {(bill.name ?? "").charAt(0).toUpperCase() + (bill.name ?? "").slice(1)}
                        </span>
                        <span className="text-xs text-slate-600 truncate hidden sm:block">{bill.detail ?? "—"}</span>
                        <span className="text-xs text-slate-500 tabular-nums text-right whitespace-nowrap">
                          {bill.date ? fmtDateShort(bill.date) : "—"}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-right" style={{ color }}>
                          {formatCOP(bill.amount ?? 0)}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="px-5 py-2 flex justify-end gap-3 items-center border-t border-slate-800 bg-slate-900/50">
                    <span className="text-xs text-slate-600">{bills.length} registro{bills.length !== 1 ? "s" : ""}</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums">{formatCOP(cat.value)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, status } = useSelector((state: { bills: BillsState }) => state.bills);

  const [preset, setPreset]       = useState<Preset>("year");
  const [customFrom, setCustomFrom] = useState(firstOfMonthOffset(-2));
  const [customTo, setCustomTo]   = useState(today());

  const { from, to } = useMemo(() => {
    const cur     = today();
    const curYear = cur.slice(0, 4);
    switch (preset) {
      case "month":  return { from: firstOfMonth(), to: cur };
      case "3m":     return { from: firstOfMonthOffset(-2), to: cur };
      case "6m":     return { from: firstOfMonthOffset(-5), to: cur };
      case "year":   return { from: `${curYear}-01-01`, to: cur };
      case "all": {
        const range = getDataDateRange(data);
        return range ? { from: range.min, to: range.max } : { from: cur, to: cur };
      }
      case "custom": return { from: customFrom || cur, to: customTo || cur };
    }
  }, [preset, customFrom, customTo, data]);

  const filtered   = useMemo(() => filterBillsByRange(data, from, to), [data, from, to]);
  const stats      = useMemo(() => getSummaryStats(filtered), [filtered]);
  const trend      = useMemo(() => getMonthlyTrend(data, from, to), [data, from, to]);
  const byCategory = useMemo(
    () => getSpendingByCategory(filtered).map((cat) => ({ ...cat, fill: getCategoryColor(cat.name) })),
    [filtered]
  );

  const loading = status === "checking" || status === "idle";

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

  const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions) =>
    parseLocal(s).toLocaleDateString("es-CO", opts);

  const rangeLabel =
    from === to
      ? fmtDate(from, { day: "numeric", month: "long", year: "numeric" })
      : `${fmtDate(from, { day: "numeric", month: "short", year: "numeric" })} – ${fmtDate(to, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-5">

      {/* ── Filter bar ── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset === p.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <label className="text-xs text-slate-500 font-medium">Desde</label>
            <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)}
              className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <label className="text-xs text-slate-500 font-medium">Hasta</label>
            <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)}
              className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}

        {preset !== "custom" && (
          <span className="ml-auto text-xs text-slate-600 hidden sm:block">{rangeLabel}</span>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total del período" value={formatCOP(stats.total)} sub={`${stats.recordCount} registros`} accent />
        <StatCard label="Promedio mensual"
          value={stats.recordCount > 0 ? formatCOP(stats.total / (trend.filter(t => t.total > 0).length || 1)) : "$0"}
          sub={rangeLabel} />
        <StatCard label="Categoría principal" value={stats.topCategory?.name ?? "—"}
          sub={stats.topCategory ? formatCOP(stats.topCategory.value) : undefined} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Tendencia mensual</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-slate-600 py-16 text-center">Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BarTip />} cursor={{ fill: "#1e293b" }} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Por categoría</h2>
          <p className="text-xs text-slate-600 mb-3">{rangeLabel}</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-slate-600 py-16 text-center">Sin datos en el período</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" />
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
                {byCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(cat.name) }} />
                    <span className="text-xs text-slate-500">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category breakdown ── */}
      {byCategory.length > 0 && (
        <CategoryBreakdown byCategory={byCategory} filtered={filtered} stats={stats} rangeLabel={rangeLabel} />
      )}
    </div>
  );
};

export default Dashboard;
