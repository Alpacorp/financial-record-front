import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
} from "recharts";
import {
  filterBillsByRange, getSpendingByCategory, getMonthlyTrendWithIncome,
  getSummaryStats, getDataDateRange, MonthStatCombined,
  getTagStats, getUntaggedStats, filterBillsByTag,
  getCashFlow, getCardBalances, getCreditCardNames,
} from "../utils/billsAnalytics";
import { getCategoryColor, getTagColor } from "../constants/categories";
import { Bill } from "../types/bill";
import { Ingreso } from "../mocks/ingresosMock";
import { Category, PayChannel, Tag } from "../types/catalog";
import { CardPayment } from "../types/cardPayment";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

interface IncomesState {
  data: Ingreso[];
}

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  tags: Tag[];
}

interface CardPaymentsState {
  data: CardPayment[];
}

// ─── Formatters ──────────────────────────────────────────────────────────────

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const formatShort = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

const fmtDateShort = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

/** Último día del mes desplazado `delta` meses respecto al actual (YYYY-MM-DD). */
const lastOfMonthOffset = (delta: number): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + delta + 1);
  d.setDate(0); // día 0 del mes siguiente = último día del mes buscado
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseLocal = (s: string): Date => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

// ─── Presets ──────────────────────────────────────────────────────────────────

type Preset = "month" | "prevMonth" | "3m" | "6m" | "year" | "prevYear" | "all" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "month",     label: "Este mes" },
  { id: "prevMonth", label: "Mes anterior" },
  { id: "3m",        label: "3 meses" },
  { id: "6m",        label: "6 meses" },
  { id: "year",      label: "Este año" },
  { id: "prevYear",  label: "Año anterior" },
  { id: "all",       label: "Todo" },
  { id: "custom",    label: "Personalizado" },
];

// ─── CSV export ───────────────────────────────────────────────────────────────

const exportToCSV = (bills: Bill[], from: string, to: string) => {
  const headers = ["Nombre", "Categoría", "Detalle", "Monto", "Fecha", "Tipo", "Método de pago", "Marcas"];
  const rows = bills.map((b) => [
    b.name ?? "", b.category ?? "", b.detail ?? "",
    b.amount ?? 0, b.date ?? "", b.type ?? "", b.paymethod ?? "",
    (b.tags ?? []).join(" | "),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `gastos_${from}_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Tooltips ─────────────────────────────────────────────────────────────────

const CombinedBarTip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl px-3 py-2 text-sm">
      <p className="font-medium text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.fill }}>
          {p.name}: {formatCOP(p.value)}
        </p>
      ))}
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

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false, color }: {
  label: string; value: string; sub?: string; accent?: boolean; color?: string;
}) => (
  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 truncate ${color ?? (accent ? "text-indigo-400" : "text-slate-100")}`}>{value}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

// ─── Category breakdown ───────────────────────────────────────────────────────

interface CategoryBreakdownProps {
  byCategory: { name: string; value: number; fill: string }[];
  filtered: Bill[];
  stats: { total: number; recordCount: number; topCategory?: { name: string; value: number } | null };
  rangeLabel: string;
}

const CategoryBreakdown = ({ byCategory, filtered, stats, rangeLabel }: CategoryBreakdownProps) => {
  const { categories } = useSelector((state: { catalog: CatalogState }) => state.catalog);
  const emojiMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { if (c.emoji) m[c.name] = c.emoji; });
    return m;
  }, [categories]);

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
                <span className="text-sm text-slate-300 flex-1 font-medium">
                  {emojiMap[cat.name] ? `${emojiMap[cat.name]} ` : ""}{cat.name}
                </span>
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, status }  = useSelector((state: { bills: BillsState }) => state.bills);
  const { data: incomes } = useSelector((state: { incomes: IncomesState }) => state.incomes);
  const { categories, payChannels, tags } = useSelector((state: { catalog: CatalogState }) => state.catalog);
  const { data: cardPayments } = useSelector((state: { cardPayments: CardPaymentsState }) => state.cardPayments);

  const emojiMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { if (c.emoji) m[c.name] = c.emoji; });
    return m;
  }, [categories]);

  const [preset, setPreset]         = useState<Preset>("year");
  const [customFrom, setCustomFrom] = useState(firstOfMonthOffset(-2));
  const [customTo, setCustomTo]     = useState(today());
  // Cuando hay una marca activa, todo el análisis de gastos se limita a ella.
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const cur     = today();
    const curYear = cur.slice(0, 4);
    switch (preset) {
      case "month":     return { from: firstOfMonth(), to: cur };
      case "prevMonth": return { from: firstOfMonthOffset(-1), to: lastOfMonthOffset(-1) };
      case "3m":     return { from: firstOfMonthOffset(-2), to: cur };
      case "6m":     return { from: firstOfMonthOffset(-5), to: cur };
      case "year":   return { from: `${curYear}-01-01`, to: cur };
      case "prevYear": {
        const prev = Number(curYear) - 1;
        return { from: `${prev}-01-01`, to: `${prev}-12-31` };
      }
      case "all": {
        const range = getDataDateRange(data);
        if (!range) return { from: cur, to: cur };
        const fromFull = range.min + "-01";
        const [ty, tm] = range.max.split("-").map(Number);
        const lastDay  = new Date(ty, tm, 0).getDate();
        const toFull   = `${range.max}-${String(lastDay).padStart(2, "0")}`;
        return { from: fromFull, to: toFull };
      }
      case "custom": return { from: customFrom || cur, to: customTo || cur };
    }
  }, [preset, customFrom, customTo, data]);

  // Universo de gastos según la marca activa; el rango se sigue calculando
  // sobre todos los datos para que "Todo" no cambie al activar el filtro.
  const scopedData = useMemo(
    () => (activeTag ? filterBillsByTag(data, activeTag) : data),
    [data, activeTag]
  );

  const filtered      = useMemo(() => filterBillsByRange(scopedData, from, to), [scopedData, from, to]);
  const stats         = useMemo(() => getSummaryStats(filtered), [filtered]);
  const combinedTrend = useMemo(
    () => getMonthlyTrendWithIncome(scopedData, incomes, from, to),
    [scopedData, incomes, from, to]
  );

  // Indicadores por marca: siempre sobre el período completo, sin el filtro,
  // para que sigan siendo comparables cuando hay una marca activa.
  const periodBills   = useMemo(() => filterBillsByRange(data, from, to), [data, from, to]);
  const periodTotal   = useMemo(() => periodBills.reduce((s, b) => s + (b.amount ?? 0), 0), [periodBills]);
  const tagStats      = useMemo(() => getTagStats(periodBills, tags), [periodBills, tags]);
  const untaggedStats = useMemo(() => getUntaggedStats(periodBills), [periodBills]);
  const activeTagStat = useMemo(
    () => tagStats.find((t) => t.name === activeTag) ?? null,
    [tagStats, activeTag]
  );

  // Tarjetas de crédito: causación vs. caja
  const creditCardNames = useMemo(() => getCreditCardNames(payChannels), [payChannels]);
  const cashFlow = useMemo(
    () => getCashFlow(data, incomes, cardPayments, from, to, creditCardNames),
    [data, incomes, cardPayments, from, to, creditCardNames]
  );
  const cardBalances = useMemo(
    () => getCardBalances(data, cardPayments, creditCardNames, to),
    [data, cardPayments, creditCardNames, to]
  );
  const totalCardDebt = useMemo(
    () => cardBalances.reduce((s, c) => s + c.balance, 0),
    [cardBalances]
  );
  const byCategory = useMemo(
    () => getSpendingByCategory(filtered).map((cat) => ({ ...cat, fill: getCategoryColor(cat.name) })),
    [filtered]
  );

  // Investment split
  const investmentCats = useMemo(
    () => new Set(categories.filter((c) => c.isInvestment).map((c) => c.name)),
    [categories]
  );
  const operatingTotal = useMemo(
    () => filtered.filter((b) => !investmentCats.has(b.category)).reduce((s, b) => s + (b.amount ?? 0), 0),
    [filtered, investmentCats]
  );
  const investmentTotal = useMemo(
    () => filtered.filter((b) => investmentCats.has(b.category)).reduce((s, b) => s + (b.amount ?? 0), 0),
    [filtered, investmentCats]
  );

  // Income for period
  const incomeTotal = useMemo(
    () => incomes.filter((i) => i.date >= from && i.date <= to).reduce((s, i) => s + i.amount, 0),
    [incomes, from, to]
  );
  const balance    = incomeTotal - stats.total;
  const balancePos = balance >= 0;

  // Derived stats
  const daysDiff = useMemo(() => {
    const diff = Math.round(
      (parseLocal(to).getTime() - parseLocal(from).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return Math.max(1, diff);
  }, [from, to]);

  const dailyAvg       = stats.total / daysDiff;
  const savingRate     = incomeTotal > 0 ? ((incomeTotal - stats.total) / incomeTotal) * 100 : null;
  const monthsWithData = combinedTrend.filter((t) => t.gastos > 0).length || 1;
  const monthlyAvg     = stats.total / monthsWithData;

  // Top 5 individual expenses
  const top5 = useMemo(
    () => [...filtered].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)).slice(0, 5),
    [filtered]
  );

  // Drill-down: click bar → set custom range to that month
  const handleBarClick = (barData: MonthStatCombined) => {
    if (!barData?.key) return;
    const [y, m] = barData.key.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setCustomFrom(`${barData.key}-01`);
    setCustomTo(`${barData.key}-${String(lastDay).padStart(2, "0")}`);
    setPreset("custom");
  };

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
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-slate-500 font-medium">Desde</label>
            <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)}
              className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <label className="text-xs text-slate-500 font-medium">Hasta</label>
            <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)}
              className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {preset !== "custom" && (
            <span className="text-xs text-slate-600 hidden sm:block">{rangeLabel}</span>
          )}
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(filtered, from, to)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded-lg hover:text-slate-100 hover:bg-slate-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Aviso de marca activa ── */}
      {activeTag && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-5 py-3 border"
          style={{ backgroundColor: `${getTagColor(activeTag)}14`, borderColor: `${getTagColor(activeTag)}4d` }}>
          <span className="text-sm font-medium" style={{ color: getTagColor(activeTag) }}>
            {activeTagStat?.emoji ? `${activeTagStat.emoji} ` : "🏷️ "}
            Viendo solo los gastos con la marca «{activeTag}»
          </span>
          <span className="text-xs text-slate-500">
            El balance y la tasa de ahorro se ocultan: los ingresos no llevan marcas.
          </span>
          <button onClick={() => setActiveTag(null)}
            className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-200 underline underline-offset-2">
            Quitar filtro
          </button>
        </div>
      )}

      {/* ── Balance neto (devengado) ── */}
      {!activeTag && (
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Balance neto del período (devengado)</h2>
          <span className="text-xs text-slate-600">{rangeLabel}</span>
        </div>

        <div className={`grid gap-4 ${investmentTotal > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Ingresos</p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatCOP(incomeTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Gastos op.</p>
            <p className="text-xl font-bold text-rose-400 tabular-nums">{formatCOP(operatingTotal)}</p>
          </div>
          {investmentTotal > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Inversiones</p>
              <p className="text-xl font-bold text-amber-400 tabular-nums">{formatCOP(investmentTotal)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Balance</p>
            <p className={`text-xl font-bold tabular-nums ${balancePos ? "text-emerald-400" : "text-rose-400"}`}>
              {balancePos ? "+" : ""}{formatCOP(balance)}
            </p>
          </div>
        </div>

        {(incomeTotal > 0 || stats.total > 0) && (() => {
          const total = incomeTotal + operatingTotal + investmentTotal;
          return (
            <div className="mt-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex gap-px">
                {incomeTotal > 0 && (
                  <div className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(incomeTotal / total) * 100}%` }} />
                )}
                {operatingTotal > 0 && (
                  <div className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${(operatingTotal / total) * 100}%` }} />
                )}
                {investmentTotal > 0 && (
                  <div className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                    style={{ width: `${(investmentTotal / total) * 100}%` }} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Ingresos {total > 0 ? `${((incomeTotal / total) * 100).toFixed(0)}%` : "0%"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Gastos op. {total > 0 ? `${((operatingTotal / total) * 100).toFixed(0)}%` : "0%"}
                </span>
                {investmentTotal > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Inversiones {`${((investmentTotal / total) * 100).toFixed(0)}%`}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
      )}

      {/* ── Aviso: hay compras a crédito pero ninguna tarjeta marcada ── */}
      {!activeTag && creditCardNames.size === 0 && data.some((b) => b.type === "Crédito") && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
          <p className="text-sm text-amber-300 font-medium">💳 Marca tus tarjetas de crédito</p>
          <p className="text-xs text-amber-400/70 mt-0.5">
            En Configuración → Métodos de pago, marca cuáles son tarjeta de crédito. Con eso el dashboard puede
            separar el gasto (cuándo compraste) del flujo de caja (cuándo pagaste la tarjeta) y mostrar el saldo pendiente.
          </p>
        </div>
      )}

      {/* ── Flujo de caja y tarjetas de crédito ── */}
      {!activeTag && creditCardNames.size > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Flujo de caja del período</h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                Cuándo salió el dinero de verdad. El pago de una tarjeta no es un gasto: la compra ya se contó el día que la hiciste.
              </p>
            </div>
            <span className="text-xs text-slate-600 hidden sm:block shrink-0">{rangeLabel}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Ingresos</p>
              <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatCOP(cashFlow.incomes)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Gastos sin tarjeta</p>
              <p className="text-xl font-bold text-rose-400 tabular-nums">{formatCOP(cashFlow.nonCardExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Pagos a tarjetas</p>
              <p className="text-xl font-bold text-amber-400 tabular-nums">{formatCOP(cashFlow.cardPayments)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Caja neta</p>
              <p className={`text-xl font-bold tabular-nums ${cashFlow.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {cashFlow.net >= 0 ? "+" : ""}{formatCOP(cashFlow.net)}
              </p>
            </div>
          </div>

          {cashFlow.cardExpenses > 0 && (
            <p className="text-xs text-slate-500 mt-4 bg-slate-800/50 rounded-lg px-3 py-2">
              💳 <span className="text-slate-300 font-medium">{formatCOP(cashFlow.cardExpenses)}</span> en compras con
              tarjeta dentro del período todavía no tocan la caja: saldrán cuando pagues la tarjeta.
            </p>
          )}

          {/* Saldo por tarjeta */}
          {cardBalances.length > 0 && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Saldo por tarjeta {to !== today() && <span className="normal-case font-normal text-slate-600">al {fmtDateShort(to)}</span>}
                </h3>
                <span className={`text-sm font-bold tabular-nums ${totalCardDebt > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  Deuda total: {formatCOP(totalCardDebt)}
                </span>
              </div>

              <div className="space-y-2">
                {cardBalances.map((c) => {
                  const paidPct = c.charged > 0 ? Math.min(100, (c.paid / c.charged) * 100) : 100;
                  const settled = c.balance <= 0;
                  return (
                    <div key={c.card} className="bg-slate-800/40 rounded-lg px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-200">{c.card}</span>
                        <span className={`text-sm font-bold tabular-nums ${settled ? "text-emerald-400" : "text-amber-400"}`}>
                          {settled ? "Al día" : formatCOP(c.balance)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${paidPct}%`, backgroundColor: settled ? "#10b981" : "#f59e0b" }} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-600">
                        <span>Comprado {formatCOP(c.charged)} · {c.chargeCount} registro{c.chargeCount !== 1 ? "s" : ""}</span>
                        <span>Pagado {formatCOP(c.paid)}{c.paymentCount > 0 ? ` · ${c.paymentCount} pago${c.paymentCount !== 1 ? "s" : ""}` : ""}</span>
                        {c.lastPaymentDate && <span>Último pago {fmtDateShort(c.lastPaymentDate)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={activeTag ? `Gastos · ${activeTag}` : "Total gastos"}
          value={formatCOP(stats.total)}
          sub={`${stats.recordCount} registros`}
          accent
        />
        <StatCard
          label="Promedio mensual"
          value={formatCOP(monthlyAvg)}
          sub={`${monthsWithData} mes${monthsWithData !== 1 ? "es" : ""} con datos`}
        />
        <StatCard
          label="Promedio diario"
          value={formatCOP(dailyAvg)}
          sub={`${daysDiff} día${daysDiff !== 1 ? "s" : ""} en el período`}
        />
        {activeTag ? (
          <StatCard
            label="% del gasto total"
            value={`${(activeTagStat?.sharePct ?? 0).toFixed(1)}%`}
            sub={`De ${formatCOP(periodTotal)} gastados`}
          />
        ) : (
          <StatCard
            label="Tasa de ahorro"
            value={savingRate !== null ? `${savingRate >= 0 ? "+" : ""}${savingRate.toFixed(1)}%` : "N/D"}
            sub={savingRate !== null ? (savingRate >= 0 ? "Superávit en el período" : "Déficit en el período") : "Sin ingresos registrados"}
            color={savingRate !== null ? (savingRate >= 0 ? "text-emerald-400" : "text-rose-400") : undefined}
          />
        )}
      </div>

      {/* ── Indicadores por marca ── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Gasto por marca</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Haz clic en una marca para filtrar todo el dashboard. Un gasto puede llevar varias, así que los montos no suman el total.
            </p>
          </div>
          <span className="text-xs text-slate-600 hidden sm:block">{rangeLabel}</span>
        </div>

        {tags.length === 0 ? (
          <p className="text-sm text-slate-600 px-5 py-8 text-center">
            Aún no tienes marcas. Créalas en <span className="text-slate-400 font-medium">Configuración → Marcas</span> para
            agrupar tus gastos por factura electrónica, hijos, trabajo o lo que necesites.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {tagStats.map((tag) => {
              const color    = getTagColor(tag.name);
              const isActive = activeTag === tag.name;
              return (
                <div key={tag.name}>
                  <button
                    onClick={() => setActiveTag(isActive ? null : tag.name)}
                    disabled={tag.count === 0}
                    className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                      tag.count === 0 ? "opacity-50 cursor-default" : "hover:bg-slate-800/50"
                    } ${isActive ? "bg-slate-800/60" : ""}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-slate-300 flex-1 font-medium truncate">
                      {tag.emoji ? `${tag.emoji} ` : ""}{tag.name}
                    </span>
                    <span className="text-xs text-slate-600 tabular-nums hidden sm:block">
                      {tag.count} registro{tag.count !== 1 ? "s" : ""}
                    </span>
                    <div className="w-24 hidden sm:block">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, tag.sharePct)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 w-12 text-right hidden sm:block tabular-nums">
                      {tag.sharePct.toFixed(0)}%
                    </span>
                    <span className="text-sm font-semibold text-slate-100 tabular-nums w-28 text-right">
                      {formatCOP(tag.total)}
                    </span>
                  </button>

                  {isActive && tag.byCategory.length > 0 && (
                    <div className="px-5 pb-3 flex flex-wrap gap-x-3 gap-y-1.5 bg-slate-800/60">
                      {tag.byCategory.slice(0, 6).map((cat) => (
                        <span key={cat.name} className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium"
                          style={{ backgroundColor: `${getCategoryColor(cat.name)}20`, color: getCategoryColor(cat.name) }}>
                          {emojiMap[cat.name] ? `${emojiMap[cat.name]} ` : ""}{cat.name}
                          <span className="opacity-80 font-semibold">{formatCOP(cat.value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Cuánto queda sin clasificar: mide qué tan fiables son los indicadores de arriba */}
            <div className="flex items-center gap-4 px-5 py-3 bg-slate-950/40">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-700" />
              <span className="text-sm text-slate-500 flex-1">Sin marcar</span>
              <span className="text-xs text-slate-600 tabular-nums hidden sm:block">
                {untaggedStats.count} registro{untaggedStats.count !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-600 w-12 text-right hidden sm:block tabular-nums">
                {untaggedStats.sharePct.toFixed(0)}%
              </span>
              <span className="text-sm font-semibold text-slate-500 tabular-nums w-28 text-right">
                {formatCOP(untaggedStats.total)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Combined bar chart */}
        <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Tendencia mensual</h2>
              <p className="text-xs text-slate-600 mt-0.5">Clic en una barra para filtrar ese mes</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                Gastos
              </span>
              {!activeTag && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Ingresos
                </span>
              )}
            </div>
          </div>
          {combinedTrend.length === 0 ? (
            <p className="text-sm text-slate-600 py-16 text-center">Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={combinedTrend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CombinedBarTip />} cursor={{ fill: "#1e293b" }} />
                <Bar dataKey="gastos" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24}
                  onClick={(d) => handleBarClick(d as unknown as MonthStatCombined)} style={{ cursor: "pointer" }} />
                {/* Los ingresos no se marcan por hijo: mostrarlos junto al gasto filtrado engañaría */}
                {!activeTag && (
                  <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24}
                    onClick={(d) => handleBarClick(d as unknown as MonthStatCombined)} style={{ cursor: "pointer" }} />
                )}
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
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" />
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
                {byCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(cat.name) }} />
                    <span className="text-xs text-slate-500">
                      {emojiMap[cat.name] ? `${emojiMap[cat.name]} ` : ""}{cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top 5 gastos ── */}
      {top5.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Top 5 gastos del período</h2>
            <p className="text-xs text-slate-600 mt-0.5">{rangeLabel}</p>
          </div>
          <div className="divide-y divide-slate-800">
            {top5.map((bill, i) => {
              const color = getCategoryColor(bill.category);
              return (
                <div key={bill._id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <span className="text-xs font-bold text-slate-700 w-4 shrink-0 tabular-nums">{i + 1}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">
                      {(bill.name ?? "").charAt(0).toUpperCase() + (bill.name ?? "").slice(1)}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {emojiMap[bill.category] ? `${emojiMap[bill.category]} ` : ""}{bill.category}
                      {bill.detail ? ` · ${bill.detail}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums shrink-0 hidden sm:block">
                    {bill.date ? fmtDateShort(bill.date) : ""}
                  </span>
                  <span className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>
                    {formatCOP(bill.amount ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {byCategory.length > 0 && (
        <CategoryBreakdown
          byCategory={byCategory}
          filtered={filtered}
          stats={stats}
          rangeLabel={rangeLabel}
        />
      )}
    </div>
  );
};

export default Dashboard;
