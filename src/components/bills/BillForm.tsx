import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { BillFormValues } from "../../types/bill";
import { Category, PayChannel } from "../../types/catalog";
import CatalogEmptyWarning from "../CatalogEmptyWarning";
import billsApi from "../../apis/billsApi";
import { getCategoryLabel } from "../../constants/categories";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
}

interface BillFormProps {
  onSubmit: (values: BillFormValues) => Promise<void>;
  loading?: boolean;
}

const EMPTY_FORM: BillFormValues = {
  name: "", category: "", detail: "", amount: 0, date: "", type: "Contado", paymethod: "", dues: undefined,
};

type FormErrors = Partial<Record<keyof BillFormValues, string>>;

const validate = (form: BillFormValues): FormErrors => {
  const e: FormErrors = {};
  if (!form.name.trim())             e.name      = "El nombre es obligatorio";
  if (!form.category)                e.category  = "Selecciona una categoría";
  if (!form.detail.trim())           e.detail    = "El detalle es obligatorio";
  if (!form.amount || form.amount <= 0) e.amount = "El monto debe ser mayor a $0";
  if (!form.date)                    e.date      = "La fecha es obligatoria";
  if (!form.paymethod)               e.paymethod = "Selecciona un método de pago";
  if (form.type === "Crédito" && (!form.dues || form.dues < 1))
    e.dues = "Indica el número de cuotas";
  return e;
};

const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1";
const inputBase  = "w-full px-3 py-2.5 rounded-lg border text-sm text-slate-100 bg-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-slate-500";
const inputOk    = "border-slate-600 focus:ring-indigo-500";
const inputError = "border-red-500/60 bg-red-500/5 focus:ring-red-500";

const fieldInputClass = (err?: string) => `${inputBase} ${err ? inputError : inputOk}`;
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const BillForm = ({ onSubmit, loading = false }: BillFormProps) => {
  const { categories, payChannels, status: catalogStatus } = useSelector(
    (state: { catalog: CatalogState }) => state.catalog
  );

  const [form, setForm]             = useState<BillFormValues>(EMPTY_FORM);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [collapsed, setCollapsed]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI state
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiText, setAiText]       = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  // Voice recognition state
  const [recording, setRecording]   = useState(false);
  const [voiceSupported]            = useState(() =>
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const startRecording = () => {
    const SR = (window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition);
    const recognition = new SR();
    recognition.lang = "es-CO";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setAiText(transcript);
      setAiError(null);
    };

    recognition.onerror = () => {
      setRecording(false);
      setAiError("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
    };

    recognition.onend = () => {
      setRecording(false);
      // Auto-parse when voice ends if there's text
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setAiError(null);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const expenseCategories = categories.filter((c) => c.type === "gasto");
  const paymentMethods = payChannels.filter((p) =>
    form.type === "Contado"
      ? p.type === "contado" || p.type === "ambos"
      : p.type === "credito" || p.type === "ambos"
  );

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const { data } = await billsApi.post("/ai/parse-expense", {
        text: aiText,
        categories: expenseCategories.map((c) => c.name),
        paymethods: payChannels.map((p) => p.name),
        today: todayStr(),
      });
      if (data.ok && data.parsed) {
        const p = data.parsed;
        setForm({
          name:      p.name      ?? "",
          category:  p.category  ?? "",
          detail:    p.detail    ?? "",
          amount:    Number(p.amount)  || 0,
          date:      p.date      ?? "",
          type:      p.type === "Crédito" ? "Crédito" : "Contado",
          paymethod: p.paymethod ?? "",
          dues:      p.dues      ?? undefined,
        });
        setErrors({});
        setAiOpen(false);
        setAiText("");
      }
    } catch {
      setAiError("No se pudo interpretar el texto. Intenta ser más específico.");
    } finally {
      setAiLoading(false);
    }
  };

  const catalogLoaded = catalogStatus === "success";
  const missingItems = catalogLoaded ? [
    ...(expenseCategories.length === 0 ? ["categorías de gastos"] : []),
    ...(paymentMethods.length === 0
      ? [`métodos de pago de ${form.type === "Contado" ? "contado" : "crédito"}`]
      : []),
  ] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: name === "amount" || name === "dues" ? Number(value) || 0 : value };
      if (name === "type") next.paymethod = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [name]: errs[name as keyof BillFormValues] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-left"
        >
          <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-semibold text-slate-200 text-sm">Registrar Gasto</span>
        </button>

        <div className="flex items-center gap-2">
          {/* AI button */}
          <button
            type="button"
            onClick={() => { setAiOpen((v) => !v); setAiError(null); if (collapsed) setCollapsed(false); }}
            title="Completar con IA"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              aiOpen
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            IA
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1"
          >
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* AI panel */}
      {aiOpen && !collapsed && (
        <div className="mx-6 mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-violet-500/10 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <span className="text-xs font-semibold text-violet-400">Describe el gasto en lenguaje natural</span>
          </div>
          <div className="p-4">
            <div className="relative">
              <textarea
                autoFocus={!recording}
                rows={2}
                value={aiText}
                onChange={(e) => { setAiText(e.target.value); setAiError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiParse(); } }}
                placeholder={recording ? "Escuchando..." : 'Ej: "ayer gasté 80 mil en mercado con débito" o habla con el micrófono'}
                className={`w-full px-3 py-2.5 pr-12 text-sm bg-slate-800 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 resize-none transition-colors ${
                  recording ? "border-red-500/60 focus:ring-red-500 placeholder-red-400/60" : "border-slate-600 focus:ring-violet-500"
                }`}
              />
              {/* Microphone button inside textarea */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={aiLoading}
                  title={recording ? "Detener grabación" : "Hablar"}
                  className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-colors ${
                    recording
                      ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                      : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"
                  }`}
                >
                  {recording ? (
                    /* Stop icon + pulse */
                    <span className="relative flex items-center justify-center w-4 h-4">
                      <span className="absolute w-4 h-4 rounded-full bg-red-500/30 animate-ping" />
                      <svg className="w-4 h-4 relative" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                    </span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Recording hint */}
            {recording && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                Grabando — habla claramente y detente cuando termines
              </p>
            )}

            {aiError && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {aiError}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-600">
                {voiceSupported ? "Escribe o habla · Enter para analizar" : "Enter para analizar · Shift+Enter nueva línea"}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setAiOpen(false); setAiText(""); setAiError(null); stopRecording(); }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleAiParse} disabled={aiLoading || !aiText.trim() || recording}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/20">
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                      Analizar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!collapsed && (
        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6">
          <div className="h-px bg-slate-800 mb-5" />
          <CatalogEmptyWarning missing={missingItems} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>
              <label className={labelClass}>Nombre del gasto</label>
              <input className={fieldInputClass(errors.name)} type="text" name="name"
                value={capitalize(form.name)} onChange={handleChange} onBlur={handleBlur}
                placeholder="Ej: Almuerzo" autoFocus />
              <FieldError msg={errors.name} />
            </div>

            <div>
              <label className={labelClass}>Categoría</label>
              <select className={fieldInputClass(errors.category)} name="category"
                value={form.category} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Selecciona una categoría</option>
                {expenseCategories.map((cat) => <option key={cat._id} value={cat.name}>{getCategoryLabel(cat.name, cat.emoji)}</option>)}
              </select>
              <FieldError msg={errors.category} />
            </div>

            <div>
              <label className={labelClass}>Detalle</label>
              <input className={fieldInputClass(errors.detail)} type="text" name="detail"
                value={capitalize(form.detail)} onChange={handleChange} onBlur={handleBlur}
                placeholder="Descripción adicional" />
              <FieldError msg={errors.detail} />
            </div>

            <div>
              <label className={labelClass}>Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input className={`${fieldInputClass(errors.amount)} pl-7`} type="number"
                  name="amount" value={form.amount || ""} onChange={handleChange} onBlur={handleBlur}
                  placeholder="0" min="1" />
              </div>
              <FieldError msg={errors.amount} />
            </div>

            <div>
              <label className={labelClass}>Fecha</label>
              <input className={fieldInputClass(errors.date)} type="date" name="date"
                value={form.date} onChange={handleChange} onBlur={handleBlur} />
              <FieldError msg={errors.date} />
            </div>

            <div>
              <label className={labelClass}>Tipo de pago</label>
              <div className={`flex rounded-lg border overflow-hidden ${errors.type ? "border-red-500/60" : "border-slate-600"}`}>
                {(["Contado", "Crédito"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => handleChange({ target: { name: "type", value: t } } as React.ChangeEvent<HTMLSelectElement>)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Método de pago</label>
              <select className={fieldInputClass(errors.paymethod)} name="paymethod"
                value={form.paymethod} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Selecciona un método</option>
                {paymentMethods.map((pm) => <option key={pm._id} value={pm.name}>{pm.name}</option>)}
              </select>
              <FieldError msg={errors.paymethod} />
            </div>

            {form.type === "Crédito" && (
              <div>
                <label className={labelClass}>Número de cuotas</label>
                <input className={fieldInputClass(errors.dues)} type="number" name="dues"
                  value={form.dues || ""} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Ej: 12" min="1" />
                <FieldError msg={errors.dues} />
              </div>
            )}
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar gasto
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BillForm;
