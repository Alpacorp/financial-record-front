import { Bill } from "../types/bill";

export interface CategoryStat {
  name: string;
  value: number;
}

export interface MonthStat {
  month: string;
  key: string;
  total: number;
}

export interface MonthStatCombined {
  month: string;
  key: string;
  gastos: number;
  ingresos: number;
}

export interface SummaryStats {
  total: number;
  topCategory: CategoryStat | null;
  recordCount: number;
}

/** Filtra registros cuya fecha (YYYY-MM-DD) caiga dentro del rango dado. */
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

/** Itera mes a mes entre fromDate y toDate, ejecutando cb con key (YYYY-MM) y label. */
const iterateMonths = (
  fromDate: string,
  toDate: string,
  cb: (key: string, label: string) => void
) => {
  const fromMonth = fromDate.slice(0, 7);
  const toMonth   = toDate.slice(0, 7);
  let [y, m] = fromMonth.split("-").map(Number);
  const [toY, toM] = toMonth.split("-").map(Number);

  while (y < toY || (y === toY && m <= toM)) {
    const key   = `${y}-${String(m).padStart(2, "0")}`;
    const label = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
    cb(key, label);
    m++;
    if (m > 12) { m = 1; y++; }
  }
};

/** Tendencia mensual de gastos. */
export const getMonthlyTrend = (
  bills: Bill[],
  fromDate: string,
  toDate: string
): MonthStat[] => {
  const result: MonthStat[] = [];
  iterateMonths(fromDate, toDate, (key, label) => {
    const total = bills
      .filter((b) => b.date?.startsWith(key))
      .reduce((sum, b) => sum + (b.amount ?? 0), 0);
    result.push({ month: label, key, total });
  });
  return result;
};

/** Tendencia mensual combinada: gastos e ingresos lado a lado. */
export const getMonthlyTrendWithIncome = (
  bills: Bill[],
  incomes: { date: string; amount: number }[],
  fromDate: string,
  toDate: string
): MonthStatCombined[] => {
  const result: MonthStatCombined[] = [];
  iterateMonths(fromDate, toDate, (key, label) => {
    const gastos   = bills.filter((b) => b.date?.startsWith(key)).reduce((sum, b) => sum + (b.amount ?? 0), 0);
    const ingresos = incomes.filter((i) => i.date?.startsWith(key)).reduce((sum, i) => sum + (i.amount ?? 0), 0);
    result.push({ month: label, key, gastos, ingresos });
  });
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
