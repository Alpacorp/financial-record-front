import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { getCategoryColor } from "../constants/categories";
import { useCatalog } from "../hooks/useCatalog";
import { Category, PayChannel } from "../types/catalog";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

type Tab = "gasto" | "ingreso" | "metodos";

const TABS: { id: Tab; label: string; labelShort: string; icon: string }[] = [
  { id: "gasto",   label: "Categorías Gastos",  labelShort: "Cat. Gastos",   icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "ingreso", label: "Categorías Ingresos", labelShort: "Cat. Ingresos", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
  { id: "metodos", label: "Métodos de Pago",     labelShort: "Métodos",       icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
];

// ─── Emoji picker (inline) ────────────────────────────────────────────────────

const EmojiPicker = ({ emoji, onSave }: { emoji?: string; onSave: (e: string) => Promise<void> }) => {
  const [open, setOpen]     = useState(false);
  const [draft, setDraft]   = useState(emoji ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setOpen(false);
  };

  if (open) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setOpen(false); }}
          maxLength={2}
          placeholder="😀"
          className="w-10 text-center px-1 py-0.5 text-base bg-slate-800 border border-indigo-500 rounded focus:outline-none"
        />
        <button onClick={handleSave} disabled={saving}
          className="px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50">
          {saving ? "..." : "OK"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 px-1">✕</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      title="Agregar emoji"
      className="w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-slate-800 transition-colors"
    >
      {emoji || <span className="text-slate-600 text-xs">+😀</span>}
    </button>
  );
};

// ─── Category row ─────────────────────────────────────────────────────────────

interface CategoryRowProps {
  item: Category;
  showInvestmentToggle: boolean;
  onSave: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleInvestment: (id: string, current: boolean) => Promise<void>;
  onSaveEmoji: (id: string, emoji: string) => Promise<void>;
}

const CategoryRow = ({ item, showInvestmentToggle, onSave, onDelete, onToggleInvestment, onSaveEmoji }: CategoryRowProps) => {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(item.name);
  const [saving, setSaving]         = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [confirming, setConfirming] = useState(false);

  const color = getCategoryColor(item.name);

  const handleSave = async () => {
    if (!draft.trim() || draft === item.name) { setEditing(false); setDraft(item.name); return; }
    setSaving(true); await onSave(item._id, draft.trim()); setSaving(false); setEditing(false);
  };

  const handleToggle = async () => {
    setToggling(true); await onToggleInvestment(item._id, item.isInvestment ?? false); setToggling(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
      {/* Color dot */}
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

      {/* Emoji picker */}
      <EmojiPicker emoji={item.emoji} onSave={(e) => onSaveEmoji(item._id, e)} />

      {/* Name */}
      {editing ? (
        <input autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(item.name); } }}
          className="flex-1 px-2 py-1 text-sm bg-slate-800 border border-indigo-500 rounded text-slate-100 focus:outline-none min-w-0"
        />
      ) : (
        <span className="flex-1 text-sm text-slate-300 truncate min-w-0">{item.name}</span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "..." : "Guardar"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(item.name); }}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200">Cancelar</button>
          </>
        ) : (
          <>
            {showInvestmentToggle && (
              <button onClick={handleToggle} disabled={toggling} title={item.isInvestment ? "Quitar inversión" : "Marcar inversión"}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${
                  item.isInvestment
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-amber-500/30 hover:text-amber-400"
                }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="hidden sm:inline">Inv.</span>
              </button>
            )}
            <button onClick={() => { setEditing(true); setConfirming(false); }}
              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {confirming ? (
              <>
                <button onClick={async () => { await onDelete(item._id); }} className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500">Sí</button>
                <button onClick={() => setConfirming(false)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300">No</button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

// ─── PayChannel row ───────────────────────────────────────────────────────────

interface PayChannelRowProps {
  item: PayChannel;
  onSave: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleType: (id: string, toggle: "contado" | "credito", current: PayChannel["type"]) => Promise<void>;
}

const PayChannelRow = ({ item, onSave, onDelete, onToggleType }: PayChannelRowProps) => {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(item.name);
  const [saving, setSaving]         = useState(false);
  const [confirming, setConfirming] = useState(false);

  const hasContado = item.type === "contado" || item.type === "ambos";
  const hasCredito = item.type === "credito" || item.type === "ambos";

  const handleSave = async () => {
    if (!draft.trim() || draft === item.name) { setEditing(false); setDraft(item.name); return; }
    setSaving(true); await onSave(item._id, draft.trim()); setSaving(false); setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
      {editing ? (
        <input autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(item.name); } }}
          className="flex-1 px-2 py-1 text-sm bg-slate-800 border border-indigo-500 rounded text-slate-100 focus:outline-none min-w-0"
        />
      ) : (
        <span className="flex-1 text-sm text-slate-300 truncate min-w-0">{item.name}</span>
      )}

      <div className="flex items-center gap-1 flex-shrink-0">
        {!editing && (
          <>
            {/* Contado toggle */}
            <button onClick={() => onToggleType(item._id, "contado", item.type)}
              title={hasContado ? "Quitar Contado" : "Agregar Contado"}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                hasContado ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-blue-500/30 hover:text-blue-400"
              }`}>
              Contado
            </button>
            {/* Crédito toggle */}
            <button onClick={() => onToggleType(item._id, "credito", item.type)}
              title={hasCredito ? "Quitar Crédito" : "Agregar Crédito"}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                hasCredito ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-violet-500/30 hover:text-violet-400"
              }`}>
              Crédito
            </button>
          </>
        )}

        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "..." : "Guardar"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(item.name); }} className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200">Cancelar</button>
          </>
        ) : (
          <>
            <button onClick={() => { setEditing(true); setConfirming(false); }}
              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {confirming ? (
              <>
                <button onClick={async () => { await onDelete(item._id); }} className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500">Sí</button>
                <button onClick={() => setConfirming(false)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300">No</button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

const AddForm = ({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) => {
  const [value, setValue]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true); await onAdd(value.trim()); setValue(""); setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-slate-800 bg-slate-800/20">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      <button type="submit" disabled={loading || !value.trim()}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap">
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
    createCategory, updateCategory, deleteCategory, toggleInvestment, updateCategoryEmoji,
    createPayChannel, updatePayChannel, deletePayChannel, togglePayChannelType,
  } = useCatalog();

  const [tab, setTab] = useState<Tab>("gasto");

  const gastoList   = categories.filter((c) => c.type === "gasto");
  const ingresoList = categories.filter((c) => c.type === "ingreso");

  const loading = status === "idle" || status === "checking";

  const tabCount: Record<Tab, number> = {
    gasto:   gastoList.length,
    ingreso: ingresoList.length,
    metodos: payChannels.length,
  };

  const addPlaceholder =
    tab === "gasto"   ? "Nueva categoría de gastos..." :
    tab === "ingreso" ? "Nueva categoría de ingresos..." :
                        "Nuevo método de pago...";

  const handleAdd = async (name: string) => {
    if (tab === "gasto")   await createCategory(name, "gasto");
    else if (tab === "ingreso") await createCategory(name, "ingreso");
    else await createPayChannel(name, "ambos"); // default: applies to both
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-slate-100">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">
          Administra las categorías y métodos de pago que aparecen en tus formularios.
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">

        {/* Tabs — 3 cols on mobile, horizontal on sm+ */}
        <div className="grid grid-cols-3 sm:flex border-b border-slate-800">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden text-xs">{t.labelShort}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                tab === t.id ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-600"
              }`}>{tabCount[t.id]}</span>
            </button>
          ))}
        </div>

        {/* Hint for payment methods tab */}
        {tab === "metodos" && !loading && payChannels.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-500">Marca a qué tipo de pago aplica cada método:</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Contado</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">Crédito</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div>
            {tab === "gasto" && (
              gastoList.length === 0
                ? <p className="text-center py-12 text-slate-600 text-sm">No hay categorías. Agrega la primera abajo.</p>
                : gastoList.map((item) => (
                    <CategoryRow key={item._id} item={item} showInvestmentToggle={true}
                      onSave={async (id, name) => { await updateCategory(id, name); }}
                      onDelete={deleteCategory}
                      onToggleInvestment={toggleInvestment}
                      onSaveEmoji={updateCategoryEmoji}
                    />
                  ))
            )}
            {tab === "ingreso" && (
              ingresoList.length === 0
                ? <p className="text-center py-12 text-slate-600 text-sm">No hay categorías. Agrega la primera abajo.</p>
                : ingresoList.map((item) => (
                    <CategoryRow key={item._id} item={item} showInvestmentToggle={false}
                      onSave={async (id, name) => { await updateCategory(id, name); }}
                      onDelete={deleteCategory}
                      onToggleInvestment={toggleInvestment}
                      onSaveEmoji={updateCategoryEmoji}
                    />
                  ))
            )}
            {tab === "metodos" && (
              payChannels.length === 0
                ? <p className="text-center py-12 text-slate-600 text-sm">No hay métodos. Agrega el primero abajo.</p>
                : payChannels.map((item) => (
                    <PayChannelRow key={item._id} item={item}
                      onSave={async (id, name) => { await updatePayChannel(id, name); }}
                      onDelete={deletePayChannel}
                      onToggleType={togglePayChannelType}
                    />
                  ))
            )}
          </div>
        )}

        <AddForm placeholder={addPlaceholder} onAdd={handleAdd} />
      </div>
    </div>
  );
};

export default Configuracion;
