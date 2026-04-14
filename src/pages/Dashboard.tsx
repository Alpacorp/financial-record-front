import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
} from "recharts";
import {
  filterBillsByRange,
  getSpendingByCategory,
  getMonthlyTrend,
  getSummaryStats,
  getDataDateRange,
} from "../utils/billsAnalytics";
import { getCategoryColor } from "../constants/categories";
import { Bill } from "../types/bill";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);

const formatShort = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

/** Fecha de hoy como YYYY-MM-DD (local, sin desfase UTC). */
const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Primer día del mes actual. */
const firstOfMonth = (): string => today().slice(0, 7) + "-01";

/** Primer día de hace N meses. */
const firstOfMonthOffset = (delta: number): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

/** Parsea YYYY-MM-DD como fecha local (evita desfase UTC). */
const parseLocal = (s: string): Date => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Preset = "month" | "3m" | "6m" | "year" | "all" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "month", label: "Este mes" },
  { id: "3m",    label: "3 meses" },
  { id: "6m",    label: "6 meses" },
  { id: "year",  label: "Este año" },
  { id: "all",   label: "Todo" },
  { id: "custom", label: "Personalizado" },
];

// ─── Tooltips ────────────────────────────────────────────────────────────────

const BarTip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-0.5">{label}</p>
      <p className="text-indigo-600 font-semibold">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

const PieTip = ({ active, payload }: {
  active?: boolean; payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-0.5">{payload[0].name}</p>
      <p className="text-indigo-600 font-semibold">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 truncate ${accent ? "text-indigo-600" : "text-gray-900"}`}>
      {value}
    </p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, status } = useSelector(
    (state: { bills: BillsState }) => state.bills
  );

  const [preset, setPreset] = useState<Preset>("year");
  const [customFrom, setCustomFrom] = useState(firstOfMonthOffset(-2));
  const [customTo, setCustomTo]     = useState(today());

  // Compute effective range from preset (all dates are YYYY-MM-DD)
  const { from, to } = useMemo(() => {
    const cur      = today();
    const curYear  = cur.slice(0, 4);
    switch (preset) {
      case "month":  return { from: firstOfMonth(), to: cur };
      case "3m":     return { from: firstOfMonthOffset(-2), to: cur };
      case "6m":     return { from: firstOfMonthOffset(-5), to: cur };
      case "year":   return { from: `${curYear}-01-01`, to: cur };
      case "all": {
        const range = getDataDateRange(data);
        return range ? { from: range.min, to: range.max } : { from: cur, to: cur };
      }
      case "custom":
        return { from: customFrom || cur, to: customTo || cur };
    }
  }, [preset, customFrom, customTo, data]);

  // Filtered data + analytics
  const filtered     = useMemo(() => filterBillsByRange(data, from, to), [data, from, to]);
  const stats        = useMemo(() => getSummaryStats(filtered), [filtered]);
  const trend        = useMemo(() => getMonthlyTrend(data, from, to), [data, from, to]);
  const byCategory = useMemo(
    () => getSpendingByCategory(filtered).map((cat) => ({
      ...cat,
      fill: getCategoryColor(cat.name),
    })),
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

  // Range label for headings
  const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions) =>
    parseLocal(s).toLocaleDateString("es-CO", opts);

  const rangeLabel =
    from === to
      ? fmtDate(from, { day: "numeric", month: "long", year: "numeric" })
      : `${fmtDate(from, { day: "numeric", month: "short", year: "numeric" })} – ${fmtDate(to, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-5">

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Preset chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset === p.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <label className="text-xs text-gray-500 font-medium">Desde</label>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="text-xs text-gray-500 font-medium">Hasta</label>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Active range hint */}
        {preset !== "custom" && (
          <span className="ml-auto text-xs text-gray-400 hidden sm:block">{rangeLabel}</span>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total del período"
          value={formatCOP(stats.total)}
          sub={`${stats.recordCount} registros`}
          accent
        />
        <StatCard
          label="Promedio mensual"
          value={stats.recordCount > 0 ? formatCOP(stats.total / trend.filter(t => t.total > 0).length || stats.total) : "$0"}
          sub={rangeLabel}
        />
        <StatCard
          label="Categoría principal"
          value={stats.topCategory?.name ?? "—"}
          sub={stats.topCategory ? formatCOP(stats.topCategory.value) : undefined}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Tendencia mensual</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BarTip />} cursor={{ fill: "#f5f3ff" }} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Por categoría
          </h2>
          <p className="text-xs text-gray-400 mb-3">{rangeLabel}</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Sin datos en el período</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  />
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Leyenda personalizada fuera del SVG */}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
                {byCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getCategoryColor(cat.name) }}
                    />
                    <span className="text-xs text-gray-500">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category breakdown ──────────────────────────────────────────── */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Detalle por categoría</h2>
            <span className="text-xs text-gray-400">{rangeLabel}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {byCategory.map((cat) => {
              const pct = stats.total > 0 ? (cat.value / stats.total) * 100 : 0;
              const color = getCategoryColor(cat.name);
              return (
                <div key={cat.name} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right hidden sm:block">
                    {pct.toFixed(0)}%
                  </span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCOP(cat.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
