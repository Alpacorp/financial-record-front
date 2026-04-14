import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
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
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default AppRoutes;
