import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getCategoryColor } from "../constants/categories";
import { useCatalog } from "../hooks/useCatalog";
import { Category, PayChannel } from "../types/catalog";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "gasto" | "ingreso" | "contado" | "credito";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "gasto",   label: "Categorías Gastos",   icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "ingreso", label: "Categorías Ingresos",  icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
  { id: "contado", label: "Métodos Contado",      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "credito", label: "Métodos Crédito",      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
];

// ─── Inline-editable item row ─────────────────────────────────────────────────

interface ItemRowProps {
  id: string;
  name: string;
  showColor?: boolean;
  isInvestment?: boolean;
  showInvestmentToggle?: boolean;
  onSave: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleInvestment?: (id: string, current: boolean) => Promise<void>;
}

const ItemRow = ({
  id, name, showColor = false,
  isInvestment = false, showInvestmentToggle = false,
  onSave, onDelete, onToggleInvestment,
}: ItemRowProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(name);
  const [saving, setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft === name) { setEditing(false); setDraft(name); return; }
    setSaving(true);
    await onSave(id, draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    await onDelete(id);
  };

  const color = showColor ? getCategoryColor(name) : undefined;

  const handleToggleInvestment = async () => {
    if (!onToggleInvestment) return;
    setToggling(true);
    await onToggleInvestment(id, isInvestment);
    setToggling(false);
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors group">
      {showColor && (
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(name); } }}
          className="flex-1 px-2 py-1 text-sm bg-slate-800 border border-indigo-500 rounded text-slate-100 focus:outline-none"
        />
      ) : (
        <span className="flex-1 text-sm text-slate-300">{name}</span>
      )}

      {/* Investment toggle — always visible when active, hover-visible when inactive */}
      {showInvestmentToggle && !editing && (
        <button
          onClick={handleToggleInvestment}
          disabled={toggling}
          title={isInvestment ? "Marcada como inversión — click para quitar" : "Marcar como inversión"}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${
            isInvestment
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-500 border border-slate-700 hover:border-amber-500/30 hover:text-amber-400"
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {isInvestment ? "Inversión" : "Inversión"}
        </button>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors">
              {saving ? "..." : "Guardar"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(name); }}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setEditing(true); setConfirming(false); }}
              className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Editar">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {confirming ? (
              <>
                <button onClick={handleDelete}
                  className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirming(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  No
                </button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)}
                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Add form ─────────────────────────────────────────────────────────────────

interface AddFormProps {
  placeholder: string;
  onAdd: (name: string) => Promise<void>;
}

const AddForm = ({ placeholder, onAdd }: AddFormProps) => {
  const [value, setValue]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    await onAdd(value.trim());
    setValue("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-5 py-3 border-t border-slate-800 bg-slate-800/20">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {loading ? "..." : "Agregar"}
      </button>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Configuracion = () => {
  const { categories, payChannels, status } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );
  const {
    createCategory, updateCategory, deleteCategory, toggleInvestment,
    createPayChannel, updatePayChannel, deletePayChannel,
  } = useCatalog();

  const [tab, setTab] = useState<Tab>("gasto");

  const gastoList   = categories.filter((c) => c.type === "gasto");
  const ingresoList = categories.filter((c) => c.type === "ingreso");
  const contadoList = payChannels.filter((p) => p.type === "contado");
  const creditoList = payChannels.filter((p) => p.type === "credito");

  const loading = status === "idle" || status === "checking";

  const tabCount: Record<Tab, number> = {
    gasto:   gastoList.length,
    ingreso: ingresoList.length,
    contado: contadoList.length,
    credito: creditoList.length,
  };

  // Current tab items and handlers
  const isCategory = tab === "gasto" || tab === "ingreso";
  const items = tab === "gasto"   ? gastoList
              : tab === "ingreso" ? ingresoList
              : tab === "contado" ? contadoList
              : creditoList;

  const handleAdd = async (name: string) => {
    if (isCategory) {
      await createCategory(name, tab as Category["type"]);
    } else {
      await createPayChannel(name, tab as PayChannel["type"]);
    }
  };

  const handleSave = async (id: string, name: string) => {
    if (isCategory) await updateCategory(id, name);
    else await updatePayChannel(id, name);
  };

  const handleDelete = async (id: string) => {
    if (isCategory) await deleteCategory(id);
    else await deletePayChannel(id);
  };

  const addPlaceholder = isCategory
    ? `Nueva categoría de ${tab === "gasto" ? "gastos" : "ingresos"}...`
    : `Nuevo método de pago ${tab === "contado" ? "de contado" : "de crédito"}...`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">
          Administra las categorías y métodos de pago que aparecen en tus formularios.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-600"
              }`}>
                {tabCount[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">
            No hay elementos. Agrega el primero abajo.
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <ItemRow
                key={item._id}
                id={item._id}
                name={item.name}
                showColor={isCategory}
                isInvestment={"isInvestment" in item ? (item as Category).isInvestment : false}
                showInvestmentToggle={tab === "gasto"}
                onSave={handleSave}
                onDelete={handleDelete}
                onToggleInvestment={tab === "gasto" ? toggleInvestment : undefined}
              />
            ))}
          </div>
        )}

        {/* Add form */}
        <AddForm placeholder={addPlaceholder} onAdd={handleAdd} />
      </div>
    </div>
  );
};

export default Configuracion;
