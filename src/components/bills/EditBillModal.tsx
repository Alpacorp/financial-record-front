import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Bill, BillFormValues } from "../../types/bill";
import {
  EXPENSE_CATEGORIES,
  CASH_PAYMETHODS,
  CREDIT_PAYMETHODS,
} from "../../constants/categories";

interface EditBillModalProps {
  bill: Bill | null;
  onSave: (id: string, values: BillFormValues) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors";

const labelClass =
  "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1";

const EditBillModal = ({ bill, onSave, onClose }: EditBillModalProps) => {
  const [form, setForm] = useState<BillFormValues | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bill) {
      const { _id: _billId, ...rest } = bill;
      setForm(rest);
    }
  }, [bill]);

  if (!bill || !form) return null;

  const paymentMethods =
    form.type === "Contado" ? CASH_PAYMETHODS : CREDIT_PAYMETHODS;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        [name]: name === "amount" || name === "dues" ? Number(value) || 0 : value,
      };
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

  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Editar gasto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                type="text"
                name="name"
                value={capitalize(form.name)}
                onChange={handleChange}
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                className={inputClass}
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Detalle */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Detalle</label>
              <input
                className={inputClass}
                type="text"
                name="detail"
                value={capitalize(form.detail)}
                onChange={handleChange}
                required
              />
            </div>

            {/* Monto */}
            <div>
              <label className={labelClass}>Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  className={`${inputClass} pl-7`}
                  type="number"
                  name="amount"
                  value={form.amount || ""}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                className={inputClass}
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className={labelClass}>Tipo de pago</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {(["Contado", "Crédito"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "type", value: t },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Método */}
            <div>
              <label className={labelClass}>Método de pago</label>
              <select
                className={inputClass}
                name="paymethod"
                value={form.paymethod}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un método</option>
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            {/* Cuotas */}
            {form.type === "Crédito" && (
              <div>
                <label className={labelClass}>Cuotas</label>
                <input
                  className={inputClass}
                  type="number"
                  name="dues"
                  value={form.dues || ""}
                  onChange={handleChange}
                  min="1"
                  placeholder="Ej: 12"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditBillModal;
