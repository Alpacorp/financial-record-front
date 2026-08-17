import { Bill } from "../types/bill";
import { CardPayment } from "../types/cardPayment";

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

// ─── Indicadores por marca ───────────────────────────────────────────────────

export interface TagStat {
  name: string;
  emoji?: string;
  /** Monto marcado con esta marca dentro de los registros recibidos. */
  total: number;
  count: number;
  /** Porcentaje del gasto total del período que lleva esta marca. */
  sharePct: number;
  byCategory: CategoryStat[];
}

export const hasTag = (bill: Bill, tag: string): boolean => (bill.tags ?? []).includes(tag);

/** Solo los gastos que llevan la marca indicada. */
export const filterBillsByTag = (bills: Bill[], tag: string): Bill[] =>
  bills.filter((b) => hasTag(b, tag));

/**
 * Estadísticas de cada marca sobre los registros recibidos, ordenadas de mayor
 * a menor monto. Un gasto puede llevar varias marcas, así que los totales por
 * marca no suman el total del período.
 */
export const getTagStats = (
  bills: Bill[],
  tags: { name: string; emoji?: string }[]
): TagStat[] => {
  const periodTotal = bills.reduce((s, b) => s + (b.amount ?? 0), 0);

  return tags
    .map((tag) => {
      const tagged = filterBillsByTag(bills, tag.name);
      const total = tagged.reduce((s, b) => s + (b.amount ?? 0), 0);
      return {
        name: tag.name,
        emoji: tag.emoji,
        total,
        count: tagged.length,
        sharePct: periodTotal > 0 ? (total / periodTotal) * 100 : 0,
        byCategory: getSpendingByCategory(tagged),
      };
    })
    .sort((a, b) => b.total - a.total);
};

/** Monto y número de registros sin ninguna marca. */
export const getUntaggedStats = (bills: Bill[]): { total: number; count: number; sharePct: number } => {
  const periodTotal = bills.reduce((s, b) => s + (b.amount ?? 0), 0);
  const untagged = bills.filter((b) => (b.tags ?? []).length === 0);
  const total = untagged.reduce((s, b) => s + (b.amount ?? 0), 0);
  return {
    total,
    count: untagged.length,
    sharePct: periodTotal > 0 ? (total / periodTotal) * 100 : 0,
  };
};

// ─── Tarjetas de crédito: causación vs. caja ─────────────────────────────────

/*
  Una compra con tarjeta de crédito causa el gasto el día de la compra, pero el
  dinero sale de la caja el día en que se paga la tarjeta. Por eso hay dos cifras
  distintas y ambas son correctas:

    · Balance devengado → ingresos − gastos del período (cuándo gastaste)
    · Flujo de caja     → ingresos − gastos no-TC − pagos de tarjeta (cuándo salió)

  El pago de la tarjeta NO es un gasto: solo mueve dinero de la caja a la deuda.
  Sumarlo a los gastos contaría dos veces la misma compra.
*/

export interface CashFlow {
  incomes: number;
  /** Gastos del período pagados con canales que no son tarjeta de crédito. */
  nonCardExpenses: number;
  /** Pagos a tarjetas hechos dentro del período. */
  cardPayments: number;
  /** Compras con tarjeta del período: gasto causado que aún no toca la caja. */
  cardExpenses: number;
  /** ingresos − (gastos no-TC + pagos de tarjeta) */
  net: number;
}

export const getCashFlow = (
  bills: Bill[],
  incomes: { date: string; amount: number }[],
  cardPayments: CardPayment[],
  fromDate: string,
  toDate: string,
  creditCardNames: Set<string>
): CashFlow => {
  const inRange = (d?: string) => !!d && d >= fromDate && d <= toDate;

  const periodBills = bills.filter((b) => inRange(b.date));
  const nonCardExpenses = periodBills
    .filter((b) => !creditCardNames.has(b.paymethod))
    .reduce((s, b) => s + (b.amount ?? 0), 0);
  const cardExpenses = periodBills
    .filter((b) => creditCardNames.has(b.paymethod))
    .reduce((s, b) => s + (b.amount ?? 0), 0);

  const incomeTotal = incomes
    .filter((i) => inRange(i.date))
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  const paymentTotal = cardPayments
    .filter((p) => inRange(p.date))
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return {
    incomes: incomeTotal,
    nonCardExpenses,
    cardPayments: paymentTotal,
    cardExpenses,
    net: incomeTotal - nonCardExpenses - paymentTotal,
  };
};

export interface CardBalance {
  card: string;
  /** Total comprado con la tarjeta. */
  charged: number;
  /** Total pagado a la tarjeta. */
  paid: number;
  /** charged − paid: lo que aún debes. Negativo = saldo a favor. */
  balance: number;
  chargeCount: number;
  paymentCount: number;
  /** Fecha del último pago registrado (YYYY-MM-DD), si hay. */
  lastPaymentDate?: string;
}

/**
 * Saldo pendiente por tarjeta: todo lo comprado menos todo lo pagado, hasta
 * `upToDate` inclusive (por defecto, todo el histórico).
 */
export const getCardBalances = (
  bills: Bill[],
  cardPayments: CardPayment[],
  creditCardNames: Set<string>,
  upToDate?: string
): CardBalance[] => {
  const upTo = (d?: string) => !!d && (!upToDate || d <= upToDate);
  const map: Record<string, CardBalance> = {};

  const ensure = (card: string): CardBalance =>
    (map[card] ??= {
      card, charged: 0, paid: 0, balance: 0, chargeCount: 0, paymentCount: 0,
    });

  for (const b of bills) {
    if (!creditCardNames.has(b.paymethod) || !upTo(b.date)) continue;
    const entry = ensure(b.paymethod);
    entry.charged += b.amount ?? 0;
    entry.chargeCount += 1;
  }

  for (const p of cardPayments) {
    if (!upTo(p.date)) continue;
    const entry = ensure(p.card);
    entry.paid += p.amount ?? 0;
    entry.paymentCount += 1;
    if (!entry.lastPaymentDate || p.date > entry.lastPaymentDate) {
      entry.lastPaymentDate = p.date;
    }
  }

  return Object.values(map)
    .map((e) => ({ ...e, balance: e.charged - e.paid }))
    .sort((a, b) => b.balance - a.balance);
};

/** Nombres de los canales marcados como tarjeta de crédito. */
export const getCreditCardNames = (
  payChannels: { name: string; isCreditCard?: boolean }[]
): Set<string> =>
  new Set(payChannels.filter((p) => p.isCreditCard).map((p) => p.name));

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
