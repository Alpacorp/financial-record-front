import React, { useMemo, useState } from "react";
import { INGRESOS_MOCK, INCOME_CATEGORIES, type Ingreso } from "../mocks/ingresosMock";

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

const PAYMETHODS = ["Transferencia", "Nequi", "Daviplata", "Efectivo", "Débito", "Cheque"];

const getIncomeColor = (cat: string) => INCOME_COLORS[cat] ?? "#9ca3af";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type IngresoFormValues = Omit<Ingreso, "_id">;

type FormErrors = Partial<Record<keyof IngresoFormValues, string>>;

const EMPTY: IngresoFormValues = {
  name: "", category: "", detail: "", amount: 0, date: today(), paymethod: "",
};

const validate = (f: IngresoFormValues): FormErrors => {
  const e: FormErrors = {};
  if (!f.name.trim())        e.name      = "El nombre es obligatorio";
  if (!f.category)           e.category  = "Selecciona una categoría";
  if (!f.detail.trim())      e.detail    = "El detalle es obligatorio";
  if (!f.amount || f.amount <= 0) e.amount = "El monto debe ser mayor a $0";
  if (!f.date)               e.date      = "La fecha es obligatoria";
  if (!f.paymethod)          e.paymethod = "Selecciona un método";
  return e;
};

const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1";
const inputBase  = "w-full px-3 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-gray-400";
const inputOk    = "border-gray-300 bg-gray-50 focus:ring-emerald-500 focus:bg-white";
const inputErr   = "border-red-400 bg-red-50 focus:ring-red-400";
const fieldClass = (err?: string) => `${inputBase} ${err ? inputErr : inputOk}`;
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// ─── Income form ─────────────────────────────────────────────────────────────

const IncomeForm = ({ onAdd }: { onAdd: (v: IngresoFormValues) => void }) => {
  const [form, setForm]         = useState<IngresoFormValues>(EMPTY);
  const [errors, setErrors]     = useState<FormErrors>({});
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setTimeout(() => {          // simula latencia de red
      onAdd(form);
      setForm({ ...EMPTY, date: today() });
      setErrors({});
      setSubmitting(false);
    }, 300);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-sm">Registrar Ingreso</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6">
          <div className="h-px bg-gray-100 mb-5" />
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
                {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
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
                {PAYMETHODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <FieldError msg={errors.paymethod} />
            </div>
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center gap-2"
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

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${accent ? "text-emerald-600" : "text-gray-900"}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const Ingresos = () => {
  const [records, setRecords]       = useState<Ingreso[]>(INGRESOS_MOCK);
  const [filterCategory, setFilter] = useState("");
  const [search, setSearch]         = useState("");

  const handleAdd = (values: IngresoFormValues) => {
    const newRecord: Ingreso = {
      ...values,
      _id: `local_${Date.now()}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
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

  return (
    <div className="space-y-6">

      {/* Mock banner */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Datos de ejemplo — los registros nuevos se perderán al recargar hasta integrar el backend.
      </div>

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-50 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Registro de ingresos
              <span className="ml-2 text-xs text-gray-400 font-normal">{rows.length} resultado{rows.length !== 1 ? "s" : ""}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white w-full sm:w-48 transition-colors"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las categorías</option>
              {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Rows */}
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay registros</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rows.map((inc) => {
              const color = getIncomeColor(inc.category);
              return (
                <div key={inc._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inc.name}</p>
                    <p className="text-xs text-gray-400 truncate">{inc.detail}</p>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {inc.category}
                  </span>
                  <span className="text-xs text-gray-400 hidden md:block w-28 text-right flex-shrink-0">
                    {inc.paymethod}
                  </span>
                  <span className="text-xs text-gray-400 font-mono w-24 text-right flex-shrink-0">
                    {inc.date}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums w-32 text-right flex-shrink-0">
                    +{formatCOP(inc.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ingresos;
