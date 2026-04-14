const PALETTE = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#64748b", // slate
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#f97316", // orange (repeat)
  "#10b981", // emerald (repeat)
] as const;

export const EXPENSE_CATEGORIES = [
  "Apoyo Mamá",
  "Apoyo Papá",
  "Arriendo",
  "Carro",
  "Comida",
  "Cuotas",
  "Diversión",
  "Educación",
  "Hogar",
  "Impuestos",
  "Inversiones",
  "Mercado",
  "Plataformas Web",
  "Préstamos",
  "Ropa",
  "Salud",
  "Servicios Públicos",
  "Servicios Streaming",
  "Trabajo",
  "Transporte",
] as const;

/** Color hex asignado a cada categoría — consistente en toda la app. */
export const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((cat, i) => [cat, PALETTE[i % PALETTE.length]])
);

/** Devuelve el color hex de una categoría, o gris si no existe en el catálogo. */
export const getCategoryColor = (category: string): string =>
  CATEGORY_COLOR[category] ?? "#9ca3af";

export const CASH_PAYMETHODS = [
  "Efectivo",
  "Débito",
  "Débito Davivienda",
  "Nequi",
  "Daviplata",
  "Rappy Cuenta",
] as const;

export const CREDIT_PAYMETHODS = [
  "TC Davivienda",
  "Daviplata",
  "Nu",
  "Rappy",
  "Rappy 2",
] as const;
