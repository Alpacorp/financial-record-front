import { Bill } from "../types/bill";

export interface CategoryStat {
  name: string;
  value: number;
}

export interface MonthStat {
  month: string;
  total: number;
}

export interface SummaryStats {
  total: number;
  topCategory: CategoryStat | null;
  recordCount: number;
}

/** Filtra registros cuya fecha (YYYY-MM-DD) caiga dentro del rango dado (YYYY-MM-DD). */
export const filterBillsByRange = (
  bills: Bill[],
  fromDate: string,
  toDate: string
): Bill[] =>
  bills.filter((b) => {
    if (!b.date) return false;
    return b.date >= fromDate && b.date <= toDate;
  });

/** Agrupa gastos por categoría ordenados de mayor a menor. */
export const getSpendingByCategory = (bills: Bill[]): CategoryStat[] => {
  const map: Record<string, number> = {};
  for (const b of bills) {
    if (b.category) map[b.category] = (map[b.category] ?? 0) + (b.amount ?? 0);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Genera una barra por cada mes que toque el rango fromDate–toDate.
 * Acepta fechas completas YYYY-MM-DD o meses YYYY-MM.
 */
export const getMonthlyTrend = (
  bills: Bill[],
  fromDate: string,
  toDate: string
): MonthStat[] => {
  const fromMonth = fromDate.slice(0, 7);
  const toMonth   = toDate.slice(0, 7);
  const result: MonthStat[] = [];
  let [y, m] = fromMonth.split("-").map(Number);
  const [toY, toM] = toMonth.split("-").map(Number);

  while (y < toY || (y === toY && m <= toM)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const label = new Date(y, m - 1, 1).toLocaleDateString("es-CO", {
      month: "short",
      year: "2-digit",
    });
    const total = bills
      .filter((b) => b.date?.startsWith(key))
      .reduce((sum, b) => sum + (b.amount ?? 0), 0);
    result.push({ month: label, total });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
};

/** Estadísticas sobre los registros recibidos (sin filtrar internamente). */
export const getSummaryStats = (bills: Bill[]): SummaryStats => {
  const total = bills.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const byCategory = getSpendingByCategory(bills);
  return { total, topCategory: byCategory[0] ?? null, recordCount: bills.length };
};

/** Devuelve el mes más antiguo y el más reciente del array (YYYY-MM). */
export const getDataDateRange = (
  bills: Bill[]
): { min: string; max: string } | null => {
  const months = bills
    .map((b) => b.date?.slice(0, 7))
    .filter((d): d is string => !!d)
    .sort();
  if (!months.length) return null;
  return { min: months[0], max: months[months.length - 1] };
};
