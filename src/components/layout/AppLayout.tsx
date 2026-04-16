import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const getSessionName = (): string => {
  try {
    const token = localStorage.getItem("x-token");
    if (!token) return "";
    // Proper UTF-8 decode — atob() alone breaks accented characters
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    const payload = JSON.parse(jsonStr);
    return typeof payload.name === "string" ? payload.name : "";
  } catch {
    return "";
  }
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { to: "/",             end: true,  label: "Gastos",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { to: "/dashboard",    end: false, label: "Dashboard",    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { to: "/creditos",     end: false, label: "Créditos",     icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { to: "/presupuestos", end: false, label: "Presupuestos", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { to: "/ingresos",     end: false, label: "Ingresos",     icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
];

const BOTTOM_NAV = [
  { to: "/configuracion", end: false, label: "Configuración", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({
  to, end, label, icon, collapsed, onClick,
}: {
  to: string; end: boolean; label: string; icon: string;
  collapsed: boolean; onClick?: () => void;
}) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-indigo-500/20 text-indigo-400"
          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
      }`
    }
  >
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const Sidebar = ({
  collapsed, onToggle, onClose, userName, onLogout,
}: {
  collapsed: boolean; onToggle: () => void;
  onClose: () => void; userName: string; onLogout: () => void;
}) => {
  const { theme, toggleTheme } = useTheme();
  return (
  <aside
    className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-200 ${
      collapsed ? "w-[60px]" : "w-60"
    }`}
  >
    {/* Logo + toggle */}
    <div className={`flex items-center h-16 px-3 border-b border-slate-800 flex-shrink-0 ${collapsed ? "justify-center" : "justify-between"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-bold text-slate-100 text-sm tracking-tight truncate">
            Financial Record
          </span>
        )}
      </div>
      {!collapsed && (
        <button
          onClick={onToggle}
          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          title="Colapsar menú"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>

    {/* Main nav */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
      {MAIN_NAV.map((item) => (
        <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onClose} />
      ))}
    </nav>

    {/* Bottom section */}
    <div className="flex-shrink-0 px-2 pb-3 space-y-0.5 border-t border-slate-800 pt-3">
      {BOTTOM_NAV.map((item) => (
        <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onClose} />
      ))}

      {/* Expand button (only when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          title="Expandir menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:text-slate-200 hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
      >
        {theme === "dark" ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
        {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>}
      </button>

      {/* User + logout */}
      <div className={`flex items-center pt-2 mt-1 border-t border-slate-800 ${collapsed ? "justify-center px-0" : "gap-2 px-1"}`}>
        <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-400">
            {userName ? userName.charAt(0).toUpperCase() : "?"}
          </span>
        </div>
        {!collapsed && (
          <>
            <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{userName}</span>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={onLogout}
            className="mt-1 w-full flex items-center justify-center py-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </aside>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const AppLayout = ({ children, onLogout }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = getSessionName();

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          onClose={() => {}}
          userName={userName}
          onLogout={onLogout}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-shrink-0">
            <Sidebar
              collapsed={false}
              onToggle={() => {}}
              onClose={() => setMobileOpen(false)}
              userName={userName}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <span className="font-bold text-slate-100 text-sm">Financial Record</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
