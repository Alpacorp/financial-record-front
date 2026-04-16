import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import { store } from "./store/store";

import AppRoutes from "./containers/AppRoutes";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";

import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const isUnderMaintenance = import.meta.env.VITE_MAINTENANCE === "true";

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
      <NotificationProvider>
        {isUnderMaintenance ? (
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-semibold text-gray-600">
              Sitio en mantenimiento, vuelve pronto.
            </h1>
          </div>
        ) : (
          <AppRoutes />
        )}
      </NotificationProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
