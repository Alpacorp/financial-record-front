import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { type Ingreso } from "../mocks/ingresosMock";
import { useIncomes, type IncomePayload } from "../hooks/useIncomes";
import { Category, PayChannel } from "../types/catalog";
import CatalogEmptyWarning from "../components/CatalogEmptyWarning";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);

const INCOME_COLORS: Record<string, string> = {
  "Salario":       "#6366f1",
  "Freelance":     "#10b981",
  "Arriendo":      "#f59e0b",
  "Inversiones":   "#3b82f6",
  "Bonificación":  "#8b5cf6",
  "Venta":         "#f43f5e",
  "Transferencia": "#14b8a6",
  "Otro":          "#9ca3af",
};


const getIncomeColor = (cat: string) => INCOME_COLORS[cat] ?? "#9ca3af";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomesState {
  data: Ingreso[];
  status: "idle" | "checking" | "success" | "failure";
}

type IngresoFormValues = Omit<Ingreso, "_id">;

type FormErrors = Partial<Record<keyof IngresoFormValues, string>>;

const EMPTY: IngresoFormValues = {
  name: "", category: "", detail: "", amount: 0, date: todayStr(), paymethod: "",
};

const validate = (f: IngresoFormValues): FormErrors => {
  const e: FormErrors = {};
  if (!f.name.trim())           e.name      = "El nombre es obligatorio";
  if (!f.category)              e.category  = "Selecciona una categoría";
  if (!f.detail.trim())         e.detail    = "El detalle es obligatorio";
  if (!f.amount || f.amount <= 0) e.amount  = "El monto debe ser mayor a $0";
  if (!f.date)                  e.date      = "La fecha es obligatoria";
  if (!f.paymethod)             e.paymethod = "Selecciona un método";
  return e;
};

const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";
const inputBase  = "w-full px-3 py-2.5 rounded-lg border text-sm text-slate-100 bg-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-slate-500";
const inputOk    = "border-slate-600 focus:ring-emerald-500";
const inputErr   = "border-red-500/60 bg-red-500/5 focus:ring-red-500";
const fieldClass = (err?: string) => `${inputBase} ${err ? inputErr : inputOk}`;
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// ─── Income form ─────────────────────────────────────────────────────────────

const IncomeForm = ({ onAdd }: { onAdd: (v: IngresoFormValues) => Promise<void> }) => {
  const { categories, payChannels, status: catalogStatus } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );
  const incomeCategories = categories.filter((c) => c.type === "ingreso");
  const allPaymethods    = payChannels;

  const catalogLoaded = catalogStatus === "success";
  const missingItems = catalogLoaded ? [
    ...(incomeCategories.length === 0 ? ["categorías de ingresos"] : []),
    ...(allPaymethods.length === 0    ? ["métodos de pago"]        : []),
  ] : [];

  const [form, setForm]           = useState<IngresoFormValues>(EMPTY);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [collapsed, setCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "amount" ? Number(value) || 0 : value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const errs = validate(form);
    setErrors((p) => ({ ...p, [e.target.name]: errs[e.target.name as keyof IngresoFormValues] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await onAdd(form);
      setForm({ ...EMPTY, date: todayStr() });
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-semibold text-slate-200 text-sm">Registrar Ingreso</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6">
          <div className="h-px bg-slate-800 mb-5" />
          <CatalogEmptyWarning missing={missingItems} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={fieldClass(errors.name)}
                type="text" name="name"
                value={capitalize(form.name)}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Ej: Salario quincena"
                autoFocus
              />
              <FieldError msg={errors.name} />
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                className={fieldClass(errors.category)}
                name="category" value={form.category}
                onChange={handleChange} onBlur={handleBlur}
              >
                <option value="">Selecciona una categoría</option>
                {incomeCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <FieldError msg={errors.category} />
            </div>

            {/* Detalle */}
            <div>
              <label className={labelClass}>Detalle</label>
              <input
                className={fieldClass(errors.detail)}
                type="text" name="detail"
                value={capitalize(form.detail)}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Descripción adicional"
              />
              <FieldError msg={errors.detail} />
            </div>

            {/* Monto */}
            <div>
              <label className={labelClass}>Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  className={`${fieldClass(errors.amount)} pl-7`}
                  type="number" name="amount" min="1"
                  value={form.amount || ""}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="0"
                />
              </div>
              <FieldError msg={errors.amount} />
            </div>

            {/* Fecha */}
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                className={fieldClass(errors.date)}
                type="date" name="date"
                value={form.date}
                onChange={handleChange} onBlur={handleBlur}
              />
              <FieldError msg={errors.date} />
            </div>

            {/* Método */}
            <div>
              <label className={labelClass}>Método de pago</label>
              <select
                className={fieldClass(errors.paymethod)}
                name="paymethod" value={form.paymethod}
                onChange={handleChange} onBlur={handleBlur}
              >
                <option value="">Selecciona un método</option>
                {allPaymethods.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
              <FieldError msg={errors.paymethod} />
            </div>
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar ingreso
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Edit income modal ───────────────────────────────────────────────────────

interface EditIncomeModalProps {
  income: Ingreso | null;
  onSave: (id: string, payload: IncomePayload) => Promise<void>;
  onClose: () => void;
  categories: Category[];
  payChannels: PayChannel[];
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors placeholder-slate-500";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";

const EditIncomeModal = ({ income, onSave, onClose, categories, payChannels }: EditIncomeModalProps) => {
  // useState initialized from prop — remount via key={income._id} ensures it's always fresh
  const [form, setForm] = useState(income ? {
    name: income.name, category: income.category, detail: income.detail,
    amount: income.amount, date: income.date, paymethod: income.paymethod,
  } : null);
  const [saving, setSaving] = useState(false);

  if (!income || !form) return null;

  const incomeCategories = categories.filter((c) => c.type === "ingreso");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => p ? ({ ...p, [name]: name === "amount" ? Number(value) || 0 : value }) : p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    await onSave(income._id, {
      concept: form.name, category: form.category, detail: form.detail,
      amount: form.amount, date: form.date, channel: form.paymethod, paymethod: form.paymethod,
    });
    setSaving(false);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Editar ingreso</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input className={inputCls} name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelCls}>Categoría</label>
            <select className={inputCls} name="category" value={form.category} onChange={handleChange}>
              <option value="">Selecciona</option>
              {incomeCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Detalle</label>
            <input className={inputCls} name="detail" value={form.detail} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Monto (COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input className={`${inputCls} pl-7`} name="amount" type="number" value={form.amount || ""} onChange={handleChange} min="1" required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Fecha</label>
            <input className={inputCls} name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Método de pago</label>
            <select className={inputCls} name="paymethod" value={form.paymethod} onChange={handleChange}>
              <option value="">Selecciona</option>
              {payChannels.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-40 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              {saving ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando...</>) : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${accent ? "text-emerald-400" : "text-slate-100"}`}>{value}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const Ingresos = () => {
  const { data: records, status } = useSelector(
    (state: { incomes: IncomesState }) => state.incomes
  );
  const { categories, payChannels } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );
  const incomeCategories = categories.filter((c) => c.type === "ingreso");
  const { createIncomeStore, updateIncomeStore, deleteIncomeStore } = useIncomes();

  const [editTarget, setEditTarget]     = useState<Ingreso | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingreso | null>(null);

  const [filterCategory, setFilter] = useState("");
  const [search, setSearch]         = useState("");

  const handleAdd = async (values: IngresoFormValues): Promise<void> => {
    const payload: IncomePayload = {
      concept:   values.name,
      category:  values.category,
      detail:    values.detail,
      amount:    values.amount,
      date:      values.date,
      channel:   values.paymethod,
      paymethod: values.paymethod,
    };
    await createIncomeStore(payload);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear  = new Date().toISOString().slice(0, 4);

  const monthTotal = useMemo(
    () => records.filter((i) => i.date.startsWith(currentMonth))
      .reduce((s, i) => s + i.amount, 0),
    [records, currentMonth]
  );
  const yearTotal = useMemo(
    () => records.filter((i) => i.date.startsWith(currentYear))
      .reduce((s, i) => s + i.amount, 0),
    [records, currentYear]
  );
  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    records.filter((i) => i.date.startsWith(currentYear))
      .forEach((i) => { map[i.category] = (map[i.category] ?? 0) + i.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [records, currentYear]);

  const rows = useMemo(() => {
    let r = [...records].sort((a, b) => b.date.localeCompare(a.date));
    if (filterCategory) r = r.filter((i) => i.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.detail.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    return r;
  }, [records, filterCategory, search]);

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const loading    = status === "idle" || status === "checking";

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Form */}
      <IncomeForm onAdd={handleAdd} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Este mes"       value={formatCOP(monthTotal)} sub={monthLabel} accent />
        <StatCard
          label={`Año ${currentYear}`}
          value={formatCOP(yearTotal)}
          sub={`${records.filter((i) => i.date.startsWith(currentYear)).length} registros`}
        />
        <StatCard
          label="Fuente principal"
          value={topCategory?.[0] ?? "—"}
          sub={topCategory ? formatCOP(topCategory[1]) : undefined}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500/10 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-200">
              Registro de ingresos
              <span className="ml-2 text-xs text-slate-500 font-normal">
                {rows.length} resultado{rows.length !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48 transition-colors" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-700 rounded-lg px-3 py-2 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Todas las categorías</option>
              {incomeCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Rows */}
        {rows.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">No hay registros</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rows.map((inc) => {
              const color = getIncomeColor(inc.category);
              return (
                <div key={inc._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{inc.name}</p>
                    <p className="text-xs text-slate-500 truncate">{inc.detail}</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}>
                    {inc.category}
                  </span>
                  <span className="text-xs text-slate-500 hidden md:block w-28 text-right flex-shrink-0">{inc.paymethod}</span>
                  <span className="text-xs text-slate-500 font-mono w-24 text-right flex-shrink-0">{inc.date}</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums w-28 text-right flex-shrink-0">
                    +{formatCOP(inc.amount)}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditTarget(inc)}
                      className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Editar">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(inc)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal — key forces remount so useState initializer runs fresh */}
      <EditIncomeModal
        key={editTarget?._id}
        income={editTarget}
        onSave={updateIncomeStore}
        onClose={() => setEditTarget(null)}
        categories={categories}
        payChannels={payChannels}
      />

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        billName={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (deleteTarget) { await deleteIncomeStore(deleteTarget._id); setDeleteTarget(null); }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Ingresos;
