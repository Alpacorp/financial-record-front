import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { Bill } from "../types/bill";
import { getCategoryColor } from "../constants/categories";
import { Category } from "../types/catalog";
import { useEmojiMap } from "../hooks/useEmojiMap";
import { Budget } from "../store/budgets/budgetsSlice";
import { useBudgets } from "../hooks/useBudgets";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

interface CatalogState {
  categories: Category[];
}

interface BudgetsState {
  data: Budget[];
  status: "idle" | "checking" | "success" | "failure";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const toYM = (date: Date) => date.toISOString().slice(0, 7);

const prevMonthYM = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return toYM(d);
};

const nextMonthYM = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return toYM(d);
};

const daysInMonthYM = (ym: string): number => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
};

// ─── Budget row ───────────────────────────────────────────────────────────────

interface BudgetRowProps {
  category: string;
  spent: number;
  prevSpent: number;
  budget: number;
  budgetId?: string;
  onEdit: (cat: string) => void;
}

const BudgetRow = ({ category, spent, prevSpent, budget, onEdit }: BudgetRowProps) => {
  const color    = getCategoryColor(category);
  const pct      = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over     = budget > 0 && spent > budget;
  const warn     = budget > 0 && pct >= 80 && !over;
  const nobudget = budget === 0;
  const barColor = over ? "#f43f5e" : warn ? "#f59e0b" : color;

  const delta = prevSpent > 0
    ? Math.round(((spent - prevSpent) / prevSpent) * 100)
    : null;

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-2.5 w-40 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-slate-300 font-medium truncate">{category}</span>
      </div>

      <div className="flex-1 min-w-0">
        {nobudget ? (
          <div className="h-1.5 bg-slate-800 rounded-full" />
        ) : (
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            {nobudget ? "Sin presupuesto" : `${formatCOP(spent)} gastado`}
            {delta !== null && (
              <span className={`inline-flex items-center gap-0.5 font-medium ${delta > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
              </span>
            )}
          </span>
          {!nobudget && (
            <span className={over ? "text-red-400 font-semibold" : warn ? "text-amber-400 font-semibold" : ""}>
              {over ? `+${formatCOP(spent - budget)} sobre el límite` : `${formatCOP(budget - spent)} disponible`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          {nobudget
            ? <span className="text-xs text-slate-700">—</span>
            : <span className="text-sm font-semibold text-slate-100">{formatCOP(budget)}</span>
          }
          <p className="text-xs text-slate-700">{nobudget ? "" : "límite"}</p>
        </div>
        <button onClick={() => onEdit(category)}
          className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Edit modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  category: string; current: number; budgetId?: string;
  onSave: (value: number) => void; onClose: () => void;
}

const EditModal = ({ category, current, onSave, onClose }: EditModalProps) => {
  const [value, setValue] = useState(current > 0 ? String(current) : "");
  const [saving, setSaving] = useState(false);
  const color = getCategoryColor(category);

  const handleSave = async () => {
    setSaving(true);
    await onSave(Number(value) || 0);
    setSaving(false);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="text-base font-semibold text-slate-100">{category}</h2>
        </div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Presupuesto mensual (COP)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            autoFocus type="number" min="0" value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            placeholder="0"
            className="w-full pl-7 pr-3 py-2.5 border border-slate-600 bg-slate-800 text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
          />
        </div>
        <p className="text-xs text-slate-600 mt-1.5">Escribe 0 para eliminar el presupuesto.</p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Sort / Filter types ───────────────────────────────────────────────────────

type SortBy = "default" | "exceeded" | "spent" | "alpha";
type FilterMode = "all" | "risk" | "exceeded";

// ─── Page ─────────────────────────────────────────────────────────────────────

const Presupuestos = () => {
  const { data: bills, status: billsStatus } = useSelector(
    (state: { bills: BillsState }) => state.bills
  );
  const { categories } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );
  const emojiMap = useEmojiMap();
  const { data: budgetsList, status: budgetsStatus } = useSelector(
    (state: { budgets: BudgetsState }) => state.budgets
  );
  const { saveBudgetStore, deleteBudgetStore } = useBudgets();

  const todayYM = toYM(new Date());
  const [selectedMonth, setSelectedMonth] = useState(todayYM);
  const [editing, setEditing] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const isCurrentMonth = selectedMonth === todayYM;
  const prevMonth = prevMonthYM(selectedMonth);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "gasto"),
    [categories]
  );

  const budgetsMap = useMemo(() => {
    const map: Record<string, { amount: number; id: string }> = {};
    budgetsList.forEach((b) => { map[b.category] = { amount: b.amount, id: b._id }; });
    return map;
  }, [budgetsList]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    bills.filter((b) => b.date?.startsWith(selectedMonth))
      .forEach((b) => { map[b.category] = (map[b.category] ?? 0) + (b.amount ?? 0); });
    return map;
  }, [bills, selectedMonth]);

  const prevSpentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    bills.filter((b) => b.date?.startsWith(prevMonth))
      .forEach((b) => { map[b.category] = (map[b.category] ?? 0) + (b.amount ?? 0); });
    return map;
  }, [bills, prevMonth]);

  // Projected spend for current month only
  const projectedTotal = useMemo(() => {
    if (!isCurrentMonth) return null;
    const today = new Date().getDate();
    const totalDays = daysInMonthYM(selectedMonth);
    const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0);
    if (today === 0) return totalSpent;
    return Math.round((totalSpent / today) * totalDays);
  }, [isCurrentMonth, selectedMonth, spentByCategory]);

  const handleSave = async (value: number) => {
    if (editing === null) return;
    if (value <= 0) {
      const existing = budgetsMap[editing];
      if (existing) await deleteBudgetStore(existing.id);
    } else {
      await saveBudgetStore(editing, value);
    }
    setEditing(null);
  };

  const totalBudgeted  = budgetsList.reduce((s, b) => s + b.amount, 0);
  const totalSpent     = Object.values(spentByCategory).reduce((s, v) => s + v, 0);
  const budgetedCount  = budgetsList.length;
  const categoriesOver = expenseCategories.filter(
    (c) => budgetsMap[c.name] && (spentByCategory[c.name] ?? 0) > budgetsMap[c.name].amount
  ).length;

  // Sort + filter pipeline
  const displayCategories = useMemo(() => {
    let list = [...expenseCategories];

    // Filter
    if (filterMode === "risk") {
      list = list.filter((c) => {
        const budget = budgetsMap[c.name]?.amount ?? 0;
        const spent = spentByCategory[c.name] ?? 0;
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        return pct >= 80;
      });
    } else if (filterMode === "exceeded") {
      list = list.filter((c) => {
        const budget = budgetsMap[c.name]?.amount ?? 0;
        const spent = spentByCategory[c.name] ?? 0;
        return budget > 0 && spent > budget;
      });
    }

    // Sort
    if (sortBy === "exceeded") {
      list.sort((a, b) => {
        const budgetA = budgetsMap[a.name]?.amount ?? 0;
        const budgetB = budgetsMap[b.name]?.amount ?? 0;
        const overA = budgetA > 0 && (spentByCategory[a.name] ?? 0) > budgetA ? 1 : 0;
        const overB = budgetB > 0 && (spentByCategory[b.name] ?? 0) > budgetB ? 1 : 0;
        if (overA !== overB) return overB - overA;
        const pctA = budgetA > 0 ? (spentByCategory[a.name] ?? 0) / budgetA : 0;
        const pctB = budgetB > 0 ? (spentByCategory[b.name] ?? 0) / budgetB : 0;
        return pctB - pctA;
      });
    } else if (sortBy === "spent") {
      list.sort((a, b) => (spentByCategory[b.name] ?? 0) - (spentByCategory[a.name] ?? 0));
    } else if (sortBy === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }

    return list;
  }, [expenseCategories, filterMode, sortBy, budgetsMap, spentByCategory]);

  const loading = billsStatus === "idle" || billsStatus === "checking"
    || budgetsStatus === "idle" || budgetsStatus === "checking";

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

  const canGoNext = selectedMonth < todayYM;

  return (
    <div className="space-y-6">

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMonth(prevMonthYM(selectedMonth))}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-slate-100 capitalize w-44 text-center">
            {monthLabel(selectedMonth)}
          </h1>
          <button
            onClick={() => setSelectedMonth(nextMonthYM(selectedMonth))}
            disabled={!canGoNext}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedMonth(todayYM)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1">
              Volver al mes actual
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Presupuestado</p>
          <p className="text-2xl font-bold mt-1 text-slate-100">{formatCOP(totalBudgeted)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{budgetedCount} categorías configuradas</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {isCurrentMonth ? "Gastado este mes" : "Total gastado"}
          </p>
          <p className="text-2xl font-bold mt-1 text-indigo-400">{formatCOP(totalSpent)}</p>
          <p className="text-xs text-slate-600 mt-0.5 capitalize">{monthLabel(selectedMonth)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Categorías excedidas</p>
          <p className={`text-2xl font-bold mt-1 ${categoriesOver > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {categoriesOver}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">de {budgetedCount} con presupuesto</p>
        </div>
        {isCurrentMonth && projectedTotal !== null ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Proyección al cierre</p>
            <p className={`text-2xl font-bold mt-1 ${projectedTotal > totalBudgeted && totalBudgeted > 0 ? "text-red-400" : "text-amber-400"}`}>
              {formatCOP(projectedTotal)}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              día {new Date().getDate()} de {daysInMonthYM(selectedMonth)}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">vs mes anterior</p>
            {(() => {
              const prevTotal = Object.values(prevSpentByCategory).reduce((s, v) => s + v, 0);
              const delta = prevTotal > 0 ? Math.round(((totalSpent - prevTotal) / prevTotal) * 100) : null;
              return (
                <>
                  <p className={`text-2xl font-bold mt-1 ${delta !== null && delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 capitalize">
                    {prevTotal > 0 ? `Anterior: ${formatCOP(prevTotal)}` : "Sin datos anteriores"}
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Presupuesto por categoría</h2>
            <p className="text-xs text-slate-600 mt-0.5 capitalize">{monthLabel(selectedMonth)}</p>
          </div>

          {/* Sort + Filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {(["all", "risk", "exceeded"] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                    filterMode === mode
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  }`}>
                  {mode === "all" ? "Todas" : mode === "risk" ? "En riesgo" : "Excedidas"}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
              <option value="default">Orden por defecto</option>
              <option value="exceeded">Más excedidas primero</option>
              <option value="spent">Mayor gasto primero</option>
              <option value="alpha">Alfabético</option>
            </select>
          </div>
        </div>

        <div>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-slate-600 px-5 py-8 text-center">
              No hay categorías de gastos.{" "}
              <a href="/configuracion" className="text-indigo-400 hover:underline">
                Agrégalas en Configuración.
              </a>
            </p>
          ) : displayCategories.length === 0 ? (
            <p className="text-sm text-slate-600 px-5 py-8 text-center">
              No hay categorías que coincidan con el filtro.
            </p>
          ) : (
            displayCategories.map((cat) => (
              <BudgetRow
                key={cat._id}
                category={`${emojiMap[cat.name] ? emojiMap[cat.name] + " " : ""}${cat.name}`}
                spent={spentByCategory[cat.name] ?? 0}
                prevSpent={prevSpentByCategory[cat.name] ?? 0}
                budget={budgetsMap[cat.name]?.amount ?? 0}
                budgetId={budgetsMap[cat.name]?.id}
                onEdit={(_label) => setEditing(cat.name)}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          category={editing}
          current={budgetsMap[editing]?.amount ?? 0}
          budgetId={budgetsMap[editing]?.id}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default Presupuestos;
