import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import billsApi from "../../apis/billsApi";
import axios from "axios";

interface AccessGateProps {
  onAccess: () => void;
}

type Mode = "login" | "register";

const AccessGate = ({ onAccess }: AccessGateProps) => {
  const { login } = useAuth();

  const [mode, setMode]               = useState<Mode>("login");
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const reset = (next: Mode) => {
    setMode(next);
    setName(""); setEmail(""); setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "login") {
      const result = await login(email, password);
      if (result.ok) {
        onAccess();
      } else {
        setError(result.error ?? "Credenciales incorrectas");
        setLoading(false);
      }
    } else {
      try {
        await billsApi.post("/auth/new", { name, email, password });
        // Auto-login after registration
        const result = await login(email, password);
        if (result.ok) {
          onAccess();
        } else {
          setError("Cuenta creada. Inicia sesión.");
          reset("login");
          setLoading(false);
        }
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.msg
            ? err.response.data.msg
            : "Error al crear la cuenta";
        setError(msg);
        setLoading(false);
      }
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
      hasError
        ? "border-red-400 bg-red-50"
        : "border-gray-300 bg-gray-50 focus:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Financial Record</h1>
                <p className="text-indigo-200 text-xs">Control de gastos personales</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 font-semibold text-lg mb-1">
              {mode === "login" ? "Bienvenido" : "Crear cuenta"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {mode === "login"
                ? "Ingresa tus credenciales para continuar"
                : "Completa los datos para registrarte"}
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Name (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    className={inputClass(!!error)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    autoFocus
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className={inputClass(!!error)}
                  placeholder="usuario@correo.com"
                  autoComplete="email"
                  autoFocus={mode === "login"}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña {mode === "register" && <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className={`${inputClass(!!error)} pr-12`}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password || (mode === "register" && !name)}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === "login" ? "Verificando..." : "Creando cuenta..."}
                  </>
                ) : (
                  mode === "login" ? "Ingresar" : "Crear cuenta e ingresar"
                )}
              </button>

              {/* Mode toggle */}
              <p className="text-center text-sm text-gray-500 pt-1">
                {mode === "login" ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => reset("register")}
                      className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Regístrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => reset("login")}
                      className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Inicia sesión
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Financial Record · Gestión de gastos personales
        </p>
      </div>
    </div>
  );
};

export default AccessGate;
