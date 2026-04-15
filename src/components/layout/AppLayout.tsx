import React from "react";
import { NavLink } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const getSessionName = (): string => {
  try {
    const token = localStorage.getItem("x-token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.name === "string" ? payload.name : "";
  } catch {
    return "";
  }
};

const AppLayout = ({ children, onLogout }: AppLayoutProps) => {
  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = getSessionName();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand + Nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {/* Logo — trending chart */}
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <span className="font-bold text-slate-100 text-base hidden sm:block tracking-tight">
                  Financial Record
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex items-center gap-0.5">
                {[
                  { to: "/",             end: true,  label: "Gastos",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                  { to: "/dashboard",    end: false, label: "Dashboard",    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                  { to: "/creditos",     end: false, label: "Créditos",     icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
                  { to: "/presupuestos", end: false, label: "Presupuestos", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
                  { to: "/ingresos",     end: false, label: "Ingresos",     icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
                  { to: "/configuracion", end: false, label: "Configuración", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
                ].map(({ to, end, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                      }`
                    }
                  >
                    <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 capitalize hidden lg:block">{today}</span>

              {userName && <span className="hidden sm:block w-px h-4 bg-slate-700" />}

              {/* User badge */}
              {userName && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-400">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-300 max-w-[140px] truncate">
                    {userName}
                  </span>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors ml-1"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
