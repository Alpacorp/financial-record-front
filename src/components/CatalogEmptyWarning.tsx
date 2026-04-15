import React from "react";

interface CatalogEmptyWarningProps {
  missing: string[];  // e.g. ["categorías de gastos", "métodos de pago de contado"]
}

/**
 * Amber inline banner shown inside forms when catalog lists are empty.
 * Only rendered when the catalog has loaded (status=success) but has no items.
 */
const CatalogEmptyWarning = ({ missing }: CatalogEmptyWarningProps) => {
  if (missing.length === 0) return null;

  return (
    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
      <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-400 font-medium">
          {missing.length === 1
            ? `No tienes ${missing[0]} configurados.`
            : `No tienes ${missing.join(" ni ")} configurados.`}
        </p>
        <a
          href="/configuracion"
          className="inline-flex items-center gap-1 text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-2 mt-0.5 transition-colors"
        >
          Ir a Configuración para agregarlos
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default CatalogEmptyWarning;
