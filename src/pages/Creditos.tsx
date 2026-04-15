import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Bill } from "../types/bill";
import { getCategoryColor } from "../constants/categories";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
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
  const [tab, setTab] = useState<FilterTab>("active");

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

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit shadow-lg">
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
    </div>
  );
};

export default Creditos;
