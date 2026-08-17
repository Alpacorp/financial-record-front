import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { Bill } from "../types/bill";
import { PayChannel } from "../types/catalog";
import { CardPayment, CardPaymentFormValues } from "../types/cardPayment";
import { getCategoryColor } from "../constants/categories";
import { getCardBalances, getCreditCardNames, CardBalance } from "../utils/billsAnalytics";
import { useCardPayments } from "../hooks/useCardPayments";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
}

interface CatalogState {
  payChannels: PayChannel[];
}

interface CardPaymentsState {
  data: CardPayment[];
}

type FilterTab = "active" | "completed" | "all";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const parseLocal = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

interface InstallmentInfo {
  monthlyAmount: number; paidDues: number; remainingDues: number;
  progressPct: number; isCompleted: boolean; endDate: Date;
}

const getInstallmentInfo = (bill: Bill): InstallmentInfo | null => {
  if (!bill.dues || bill.dues <= 0 || !bill.date) return null;
  const purchase = parseLocal(bill.date);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth());
  const paidDues = Math.min(Math.max(0, monthsDiff), bill.dues);
  const remainingDues = bill.dues - paidDues;
  const endDate = new Date(purchase.getFullYear(), purchase.getMonth() + bill.dues - 1, 1);
  return {
    monthlyAmount: bill.amount / bill.dues, paidDues, remainingDues,
    progressPct: (paidDues / bill.dues) * 100,
    isCompleted: remainingDues <= 0, endDate,
  };
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtDateShort = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Modal de pago de tarjeta ────────────────────────────────────────────────

const modalInput =
  "w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors placeholder-slate-500";
const modalLabel = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";

interface CardPaymentModalProps {
  card: CardBalance | null;
  sourceOptions: PayChannel[];
  onSave: (values: CardPaymentFormValues) => Promise<void>;
  onClose: () => void;
}

const CardPaymentModal = ({ card, sourceOptions, onSave, onClose }: CardPaymentModalProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate]     = useState(todayStr());
  const [source, setSource] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  if (!card) return null;

  const numericAmount = Number(amount) || 0;
  const valid = numericAmount > 0 && !!date;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({ card: card.card, amount: numericAmount, date, source, detail });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-700 sm:rounded-xl shadow-2xl shadow-black/50 w-full sm:max-w-md rounded-t-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Pagar {card.card}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Saldo pendiente: {formatCOP(card.balance)}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-300/90">
              Este pago <strong>no se cuenta como gasto</strong>: las compras ya se registraron el día que las hiciste.
              Solo descuenta de tu caja y baja el saldo de la tarjeta.
            </p>
          </div>

          <div>
            <label className={modalLabel}>Monto pagado (COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input autoFocus className={`${modalInput} pl-7`} type="number" min="1"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            {card.balance > 0 && (
              <button type="button" onClick={() => setAmount(String(Math.round(card.balance)))}
                className="text-xs text-amber-400 hover:text-amber-300 mt-1.5 font-medium">
                Pagar el total ({formatCOP(card.balance)})
              </button>
            )}
          </div>

          <div>
            <label className={modalLabel}>Fecha del pago</label>
            <input className={modalInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className={modalLabel}>Pagado desde (opcional)</label>
            <select className={modalInput} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Sin especificar</option>
              {sourceOptions.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className={modalLabel}>Detalle (opcional)</label>
            <input className={modalInput} type="text" value={detail}
              onChange={(e) => setDetail(e.target.value)} placeholder="Ej: pago total del extracto de julio" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!valid || saving}
              className="px-5 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20">
              {saving ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const StatCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg px-5 py-4">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${accent ? "text-indigo-400" : "text-slate-100"}`}>{value}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

const CreditCard = ({ bill }: { bill: Bill }) => {
  const info = getInstallmentInfo(bill);
  if (!info) return null;
  const color = getCategoryColor(bill.category);
  const endLabel = info.endDate.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className={`bg-slate-900 rounded-xl border shadow-lg p-5 flex flex-col gap-3 ${
      info.isCompleted ? "border-slate-800 opacity-60" : "border-slate-700"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-sm truncate">{bill.name}</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium mt-1"
            style={{ backgroundColor: `${color}20`, color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {bill.category}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
          info.isCompleted ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
        }`}>
          {info.isCompleted ? "Completado" : "Activo"}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-600">Total financiado</p>
          <p className="text-lg font-bold text-slate-100">{formatCOP(bill.amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600">Cuota mensual</p>
          <p className="text-base font-semibold text-indigo-400">{formatCOP(info.monthlyAmount)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{info.paidDues} de {bill.dues} cuotas</span>
          <span>{info.progressPct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${info.progressPct}%`, backgroundColor: info.isCompleted ? "#10b981" : "#6366f1" }} />
        </div>
        {!info.isCompleted && (
          <p className="text-xs text-slate-600 mt-1.5">
            {info.remainingDues} cuota{info.remainingDues !== 1 ? "s" : ""} restante{info.remainingDues !== 1 ? "s" : ""} · Termina {endLabel}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs text-slate-600">
        <span>{bill.paymethod}</span>
        <span>{bill.date}</span>
      </div>
    </div>
  );
};

const Creditos = () => {
  const { data, status } = useSelector((state: { bills: BillsState }) => state.bills);
  const { payChannels }  = useSelector((state: { catalog: CatalogState }) => state.catalog);
  const { data: cardPayments } = useSelector((state: { cardPayments: CardPaymentsState }) => state.cardPayments);
  const { createCardPaymentStore, deleteCardPaymentStore } = useCardPayments();

  const [tab, setTab] = useState<FilterTab>("active");
  const [payingCard, setPayingCard]       = useState<CardBalance | null>(null);
  const [deletePayment, setDeletePayment] = useState<CardPayment | null>(null);

  const creditCardNames = useMemo(() => getCreditCardNames(payChannels), [payChannels]);
  const cardBalances    = useMemo(
    () => getCardBalances(data, cardPayments, creditCardNames),
    [data, cardPayments, creditCardNames]
  );
  const totalCardDebt = useMemo(() => cardBalances.reduce((s, c) => s + c.balance, 0), [cardBalances]);
  // El dinero sale de canales que no son la propia tarjeta
  const sourceOptions = useMemo(() => payChannels.filter((p) => !p.isCreditCard), [payChannels]);
  const recentPayments = useMemo(
    () => [...cardPayments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [cardPayments]
  );

  const creditBills = useMemo(() => data.filter((b) => b.type === "Crédito" && b.dues && b.dues > 0), [data]);
  const enriched = useMemo(
    () => creditBills.map((b) => ({ bill: b, info: getInstallmentInfo(b)! })).filter((x) => x.info !== null),
    [creditBills]
  );
  const active    = useMemo(() => enriched.filter((x) => !x.info.isCompleted), [enriched]);
  const completed = useMemo(() => enriched.filter((x) => x.info.isCompleted), [enriched]);
  const visible   = tab === "active" ? active : tab === "completed" ? completed : enriched;

  const monthlyTotal  = useMemo(() => active.reduce((s, x) => s + x.info.monthlyAmount, 0), [active]);
  const totalFinanced = useMemo(() => enriched.reduce((s, x) => s + x.bill.amount, 0), [enriched]);

  if (status === "idle" || status === "checking") {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: "active",    label: "Activos",    count: active.length },
    { id: "completed", label: "Completados", count: completed.length },
    { id: "all",       label: "Todos",      count: enriched.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Créditos activos" value={String(active.length)} sub={`${completed.length} completados`} accent />
        <StatCard label="Cuota mensual total" value={formatCOP(monthlyTotal)} sub="Comprometido este mes" />
        <StatCard label="Total financiado" value={formatCOP(totalFinanced)} sub={`${enriched.length} compras a crédito`} />
      </div>

      {/* ══ Tarjetas de crédito: saldo y pagos ══ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Tarjetas de crédito</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lo comprado con la tarjeta menos lo que ya le has pagado. Pagar la tarjeta no es un gasto nuevo.
            </p>
          </div>
          {cardBalances.length > 0 && (
            <span className={`text-sm font-bold tabular-nums ${totalCardDebt > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              Deuda total: {formatCOP(totalCardDebt)}
            </span>
          )}
        </div>

        {creditCardNames.size === 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4">
            <p className="text-sm text-amber-300 font-medium">💳 Aún no has marcado ninguna tarjeta de crédito</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Ve a Configuración → Métodos de pago y marca cuáles son tarjeta. Desde ahí podrás registrar los pagos
              y ver el saldo real de cada una.
            </p>
          </div>
        ) : cardBalances.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-sm text-slate-600">
            No hay compras registradas con tus tarjetas todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardBalances.map((c) => {
              const paidPct = c.charged > 0 ? Math.min(100, (c.paid / c.charged) * 100) : 100;
              const settled = c.balance <= 0;
              return (
                <div key={c.card} className={`bg-slate-900 rounded-xl border shadow-lg p-5 flex flex-col gap-3 ${
                  settled ? "border-slate-800" : "border-amber-500/30"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-100 text-sm truncate">💳 {c.card}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      settled ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {settled ? "Al día" : "Con saldo"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">Saldo pendiente</p>
                    <p className={`text-2xl font-bold tabular-nums ${settled ? "text-emerald-400" : "text-amber-400"}`}>
                      {formatCOP(Math.max(0, c.balance))}
                    </p>
                  </div>

                  <div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${paidPct}%`, backgroundColor: settled ? "#10b981" : "#f59e0b" }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1.5">
                      <span>Comprado {formatCOP(c.charged)}</span>
                      <span>Pagado {formatCOP(c.paid)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-xs text-slate-600">
                      {c.lastPaymentDate ? `Último pago ${fmtDateShort(c.lastPaymentDate)}` : "Sin pagos registrados"}
                    </span>
                    <button onClick={() => setPayingCard(c)}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20">
                      Registrar pago
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historial de pagos */}
        {recentPayments.length > 0 && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">Últimos pagos a tarjetas</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {recentPayments.map((p) => (
                <div key={p._id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{p.card}</p>
                    <p className="text-xs text-slate-600 truncate">
                      {fmtDateShort(p.date)}
                      {p.source ? ` · desde ${p.source}` : ""}
                      {p.detail ? ` · ${p.detail}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-400 tabular-nums shrink-0">{formatCOP(p.amount)}</span>
                  <button onClick={() => setDeletePayment(p)} title="Eliminar pago"
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══ Compras a cuotas ══ */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">Compras a cuotas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Progreso estimado por meses transcurridos desde la compra.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-full sm:w-fit shadow-lg">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
            }`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-500"
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-sm">No hay créditos {tab === "active" ? "activos" : tab === "completed" ? "completados" : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(({ bill }) => <CreditCard key={bill._id} bill={bill} />)}
        </div>
      )}

      {/* key: remonta el modal en cada apertura para no arrastrar el monto anterior */}
      <CardPaymentModal
        key={payingCard?.card ?? "none"}
        card={payingCard}
        sourceOptions={sourceOptions}
        onSave={createCardPaymentStore}
        onClose={() => setPayingCard(null)}
      />

      <ConfirmDeleteDialog
        open={!!deletePayment}
        billName={deletePayment ? `pago de ${formatCOP(deletePayment.amount)} a ${deletePayment.card}` : ""}
        onConfirm={async () => {
          if (deletePayment) { await deleteCardPaymentStore(deletePayment._id); setDeletePayment(null); }
        }}
        onCancel={() => setDeletePayment(null)}
      />
    </div>
  );
};

export default Creditos;
