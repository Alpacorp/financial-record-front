import React from "react";
import { useSelector } from "react-redux";
import { Tag } from "../../types/catalog";
import { getTagColor } from "../../constants/categories";

/*
  Selector de marcas del gasto, compartido entre el formulario de registro y el
  modal de edición para que no se desincronicen. Las marcas se administran en
  Configuración → Marcas; aquí solo se aplican.
*/

interface CatalogState {
  tags: Tag[];
  status: "idle" | "checking" | "success" | "failure";
}

interface BillTagsFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

const BillTagsField = ({ value, onChange }: BillTagsFieldProps) => {
  const { tags, status } = useSelector((state: { catalog: CatalogState }) => state.catalog);

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((t) => t !== name) : [...value, name]);

  if (status === "success" && tags.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5">
        <p className="text-xs text-slate-500">
          🏷️ Aún no tienes marcas. Créalas en <span className="text-slate-400 font-medium">Configuración → Marcas</span> para
          poder etiquetar tus gastos (factura electrónica, hijos, trabajo…).
        </p>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        Marcas <span className="normal-case font-normal text-slate-600">· opcional, puedes elegir varias</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = value.includes(tag.name);
          const color = getTagColor(tag.name);
          return (
            <button
              key={tag._id}
              type="button"
              onClick={() => toggle(tag.name)}
              title={tag.description || undefined}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                active ? "" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
              style={active ? { backgroundColor: `${color}20`, borderColor: `${color}66`, color } : undefined}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  active ? "border-transparent" : "border-slate-600"
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                {active && (
                  <svg className="w-2.5 h-2.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {tag.emoji ? `${tag.emoji} ` : ""}{tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BillTagsField;
