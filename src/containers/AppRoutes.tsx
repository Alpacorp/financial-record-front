import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Creditos from "../pages/Creditos";
import Presupuestos from "../pages/Presupuestos";
import Ingresos from "../pages/Ingresos";
import AccessGate from "../components/auth/AccessGate";
import AppLayout from "../components/layout/AppLayout";
import { useBills } from "../hooks/useBills";
import { useIncomes } from "../hooks/useIncomes";
import { useAuth } from "../hooks/useAuth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

const AppRoutes = () => {
  const [status, setStatus] = useState<AuthStatus>("checking");

  const { checkToken, logout } = useAuth();
  const { getBillsStore }   = useBills();
  const { getIncomesStore } = useIncomes();

  // On mount: try to restore session from existing token
  useEffect(() => {
    checkToken().then((valid) => {
      if (valid) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data whenever we become authenticated
  useEffect(() => {
    if (status === "authenticated") {
      getBillsStore();
      getIncomesStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleLogin = () => setStatus("authenticated");

  const handleLogout = () => {
    logout();
    setStatus("unauthenticated");
  };

  // Validating existing token — don't flash login screen
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <AccessGate onAccess={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/creditos" element={<Creditos />} />
          <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/ingresos" element={<Ingresos />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default AppRoutes;
