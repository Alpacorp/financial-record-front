import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Bill } from "../types/bill";
import { EXPENSE_CATEGORIES, getCategoryColor } from "../constants/categories";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

const STORAGE_KEY = "financial_budgets";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);

const loadBudgets = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const saveBudgets = (b: Record<string, number>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));

// ─── Budget row ───────────────────────────────────────────────────────────────

interface BudgetRowProps {
  category: string;
  spent: number;
  budget: number;
  onEdit: (cat: string) => void;
}

const BudgetRow = ({ category, spent, budget, onEdit }: BudgetRowProps) => {
  const color  = getCategoryColor(category);
  const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over   = budget > 0 && spent > budget;
  const warn   = budget > 0 && pct >= 80 && !over;
  const nobudget = budget === 0;

  const barColor = over ? "#f43f5e" : warn ? "#f59e0b" : color;

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      {/* Color dot + name */}
      <div className="flex items-center gap-2.5 w-40 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-gray-700 font-medium truncate">{category}</span>
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        {nobudget ? (
          <div className="h-2 bg-gray-100 rounded-full" />
        ) : (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
          <span>{nobudget ? "Sin presupuesto" : `${formatCOP(spent)} gastado`}</span>
          {!nobudget && (
            <span className={over ? "text-red-500 font-semibold" : warn ? "text-amber-500 font-semibold" : ""}>
              {over
                ? `+${formatCOP(spent - budget)} sobre el límite`
                : `${formatCOP(budget - spent)} disponible`}
            </span>
          )}
        </div>
      </div>

      {/* Budget amount + edit */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          {nobudget ? (
            <span className="text-xs text-gray-400">—</span>
          ) : (
            <span className="text-sm font-semibold text-gray-900">{formatCOP(budget)}</span>
          )}
          <p className="text-xs text-gray-400">{nobudget ? "" : "límite"}</p>
        </div>
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Editar presupuesto"
        >
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
  category: string;
  current: number;
  onSave: (value: number) => void;
  onClose: () => void;
}

const EditModal = ({ category, current, onSave, onClose }: EditModalProps) => {
  const [value, setValue] = useState(current > 0 ? String(current) : "");
  const color = getCategoryColor(category);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="text-base font-semibold text-gray-900">{category}</h2>
        </div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Presupuesto mensual (COP)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            autoFocus
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSave(Number(value) || 0); }}
            placeholder="0"
            className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Escribe 0 para eliminar el presupuesto.</p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(Number(value) || 0)}
            className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

import ReactDOM from "react-dom";

const Presupuestos = () => {
  const { data, status } = useSelector((state: { bills: BillsState }) => state.bills);
  const [budgets, setBudgets] = useState<Record<string, number>>(loadBudgets);
  const [editing, setEditing] = useState<string | null>(null);

  // Persist on change
  useEffect(() => { saveBudgets(budgets); }, [budgets]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Spending per category this month
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    data
      .filter((b) => b.date?.startsWith(currentMonth))
      .forEach((b) => {
        map[b.category] = (map[b.category] ?? 0) + (b.amount ?? 0);
      });
    return map;
  }, [data, currentMonth]);

  const handleSave = (value: number) => {
    if (editing === null) return;
    setBudgets((prev) => {
      const next = { ...prev };
      if (value <= 0) delete next[editing];
      else next[editing] = value;
      return next;
    });
    setEditing(null);
  };

  // Summary
  const totalBudgeted = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent    = Object.entries(spentByCategory)
    .reduce((s, [, v]) => s + v, 0);
  const categoriesOver = EXPENSE_CATEGORIES.filter(
    (c) => budgets[c] && (spentByCategory[c] ?? 0) > budgets[c]
  ).length;
  const budgetedCount = Object.keys(budgets).length;

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

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Presupuestado</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{formatCOP(totalBudgeted)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{budgetedCount} categorías configuradas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gastado este mes</p>
          <p className="text-2xl font-bold mt-1 text-indigo-600">{formatCOP(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{monthLabel}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categorías excedidas</p>
          <p className={`text-2xl font-bold mt-1 ${categoriesOver > 0 ? "text-red-500" : "text-emerald-600"}`}>
            {categoriesOver}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">de {budgetedCount} con presupuesto</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Presupuesto por categoría</h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{monthLabel}</p>
          </div>
          <p className="text-xs text-gray-400">
            Haz clic en <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> para configurar
          </p>
        </div>
        <div>
          {EXPENSE_CATEGORIES.map((cat) => (
            <BudgetRow
              key={cat}
              category={cat}
              spent={spentByCategory[cat] ?? 0}
              budget={budgets[cat] ?? 0}
              onEdit={setEditing}
            />
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          category={editing}
          current={budgets[editing] ?? 0}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default Presupuestos;
