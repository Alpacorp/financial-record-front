import React, { useState } from "react";
import { useSelector } from "react-redux";
import { BillFormValues } from "../../types/bill";
import { Category, PayChannel } from "../../types/catalog";
import CatalogEmptyWarning from "../CatalogEmptyWarning";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

interface BillFormProps {
  onSubmit: (values: BillFormValues) => Promise<void>;
  loading?: boolean;
}

const EMPTY_FORM: BillFormValues = {
  name: "", category: "", detail: "", amount: 0, date: "", type: "Contado", paymethod: "", dues: undefined,
};

type FormErrors = Partial<Record<keyof BillFormValues, string>>;

const validate = (form: BillFormValues): FormErrors => {
  const e: FormErrors = {};
  if (!form.name.trim())             e.name      = "El nombre es obligatorio";
  if (!form.category)                e.category  = "Selecciona una categoría";
  if (!form.detail.trim())           e.detail    = "El detalle es obligatorio";
  if (!form.amount || form.amount <= 0) e.amount = "El monto debe ser mayor a $0";
  if (!form.date)                    e.date      = "La fecha es obligatoria";
  if (!form.paymethod)               e.paymethod = "Selecciona un método de pago";
  if (form.type === "Crédito" && (!form.dues || form.dues < 1))
    e.dues = "Indica el número de cuotas";
  return e;
};

const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";
const inputBase  = "w-full px-3 py-2.5 rounded-lg border text-sm text-slate-100 bg-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-slate-500";
const inputOk    = "border-slate-600 focus:ring-indigo-500";
const inputError = "border-red-500/60 bg-red-500/5 focus:ring-red-500";

const fieldInputClass = (err?: string) => `${inputBase} ${err ? inputError : inputOk}`;
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const BillForm = ({ onSubmit, loading = false }: BillFormProps) => {
  const { categories, payChannels, status: catalogStatus } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );

  const [form, setForm]             = useState<BillFormValues>(EMPTY_FORM);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [collapsed, setCollapsed]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "gasto");
  const paymentMethods = payChannels.filter((p) =>
    form.type === "Contado" ? p.type === "contado" : p.type === "credito"
  );

  const catalogLoaded = catalogStatus === "success";
  const missingItems = catalogLoaded ? [
    ...(expenseCategories.length === 0 ? ["categorías de gastos"] : []),
    ...(paymentMethods.length === 0
      ? [`métodos de pago de ${form.type === "Contado" ? "contado" : "crédito"}`]
      : []),
  ] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: name === "amount" || name === "dues" ? Number(value) || 0 : value };
      if (name === "type") next.paymethod = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [name]: errs[name as keyof BillFormValues] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg mb-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-semibold text-slate-200 text-sm">Registrar Gasto</span>
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

            <div>
              <label className={labelClass}>Nombre del gasto</label>
              <input className={fieldInputClass(errors.name)} type="text" name="name"
                value={capitalize(form.name)} onChange={handleChange} onBlur={handleBlur}
                placeholder="Ej: Almuerzo" autoFocus />
              <FieldError msg={errors.name} />
            </div>

            <div>
              <label className={labelClass}>Categoría</label>
              <select className={fieldInputClass(errors.category)} name="category"
                value={form.category} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Selecciona una categoría</option>
                {expenseCategories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
              <FieldError msg={errors.category} />
            </div>

            <div>
              <label className={labelClass}>Detalle</label>
              <input className={fieldInputClass(errors.detail)} type="text" name="detail"
                value={capitalize(form.detail)} onChange={handleChange} onBlur={handleBlur}
                placeholder="Descripción adicional" />
              <FieldError msg={errors.detail} />
            </div>

            <div>
              <label className={labelClass}>Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input className={`${fieldInputClass(errors.amount)} pl-7`} type="number"
                  name="amount" value={form.amount || ""} onChange={handleChange} onBlur={handleBlur}
                  placeholder="0" min="1" />
              </div>
              <FieldError msg={errors.amount} />
            </div>

            <div>
              <label className={labelClass}>Fecha</label>
              <input className={fieldInputClass(errors.date)} type="date" name="date"
                value={form.date} onChange={handleChange} onBlur={handleBlur} />
              <FieldError msg={errors.date} />
            </div>

            <div>
              <label className={labelClass}>Tipo de pago</label>
              <div className={`flex rounded-lg border overflow-hidden ${errors.type ? "border-red-500/60" : "border-slate-600"}`}>
                {(["Contado", "Crédito"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => handleChange({ target: { name: "type", value: t } } as React.ChangeEvent<HTMLSelectElement>)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Método de pago</label>
              <select className={fieldInputClass(errors.paymethod)} name="paymethod"
                value={form.paymethod} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Selecciona un método</option>
                {paymentMethods.map((pm) => <option key={pm._id} value={pm.name}>{pm.name}</option>)}
              </select>
              <FieldError msg={errors.paymethod} />
            </div>

            {form.type === "Crédito" && (
              <div>
                <label className={labelClass}>Número de cuotas</label>
                <input className={fieldInputClass(errors.dues)} type="number" name="dues"
                  value={form.dues || ""} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Ej: 12" min="1" />
                <FieldError msg={errors.dues} />
              </div>
            )}
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
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
                  Registrar gasto
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BillForm;
