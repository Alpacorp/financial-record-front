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

const AppRoutes = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const { getBillsStore } = useBills();

  useEffect(() => {
    if (authenticated) {
      getBillsStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  if (!authenticated) {
    return <AccessGate onAccess={() => setAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <AppLayout onLogout={() => setAuthenticated(false)}>
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
