import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { Bill, BillFormValues } from "../../types/bill";
import { Category, PayChannel } from "../../types/catalog";
import { getCategoryLabel } from "../../constants/categories";
import CatalogEmptyWarning from "../CatalogEmptyWarning";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

interface EditBillModalProps {
  bill: Bill | null;
  onSave: (id: string, values: BillFormValues) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-slate-500";

const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";

const EditBillModal = ({ bill, onSave, onClose }: EditBillModalProps) => {
  const [form, setForm]     = useState<BillFormValues | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bill) {
      const { _id: _billId, ...rest } = bill;
      setForm(rest);
    }
  }, [bill]);

  const { categories, payChannels, status: catalogStatus } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );

  if (!bill || !form) return null;

  const expenseCategories = categories.filter((c) => c.type === "gasto");
  const paymentMethods = payChannels.filter((p) =>
    form.type === "Contado"
      ? p.type === "contado" || p.type === "ambos"
      : p.type === "credito" || p.type === "ambos"
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
      if (!prev) return prev;
      const next = { ...prev, [name]: name === "amount" || name === "dues" ? Number(value) || 0 : value };
      if (name === "type") next.paymethod = "";
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await onSave(bill._id, form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 w-full max-w-xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Editar gasto</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <CatalogEmptyWarning missing={missingItems} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} type="text" name="name"
                value={capitalize(form.name)} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Categoría</label>
              <select className={inputClass} name="category" value={form.category} onChange={handleChange} required>
                <option value="">Selecciona una categoría</option>
                {expenseCategories.map((cat) => <option key={cat._id} value={cat.name}>{getCategoryLabel(cat.name, cat.emoji)}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Detalle</label>
              <input className={inputClass} type="text" name="detail"
                value={capitalize(form.detail)} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input className={`${inputClass} pl-7`} type="number" name="amount"
                  value={form.amount || ""} onChange={handleChange} min="0" required />
              </div>
            </div>

            <div>
              <label className={labelClass}>Fecha</label>
              <input className={inputClass} type="date" name="date"
                value={form.date} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Tipo de pago</label>
              <div className="flex rounded-lg border border-slate-600 overflow-hidden">
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
              <select className={inputClass} name="paymethod" value={form.paymethod} onChange={handleChange} required>
                <option value="">Selecciona un método</option>
                {paymentMethods.map((pm) => <option key={pm._id} value={pm.name}>{pm.name}</option>)}
              </select>
            </div>

            {form.type === "Crédito" && (
              <div>
                <label className={labelClass}>Cuotas</label>
                <input className={inputClass} type="number" name="dues"
                  value={form.dues || ""} onChange={handleChange} min="1" placeholder="Ej: 12" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditBillModal;
