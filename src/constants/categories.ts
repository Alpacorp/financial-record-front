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
] as const;

/** Hash determinista del nombre → color estable sin importar el orden de la lista. */
const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i);
  }
  return Math.abs(h);
};

/** Color hex de una categoría — estable por nombre, consistente en toda la app. */
export const getCategoryColor = (category: string): string =>
  PALETTE[hashName(category) % PALETTE.length] ?? "#9ca3af";

/** Returns "🛒 Mercado" or just "Mercado" when no emoji is set. */
export const getCategoryLabel = (name: string, emoji?: string): string =>
  emoji ? `${emoji} ${name}` : name;
