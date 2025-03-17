import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import { store } from "./store/store";

import AppRoutes from "./containers/AppRoutes";

import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const maintenance = process.env.REACT_APP_MAINTENANCE ?? false;

root.render(
  <React.StrictMode>
    <Provider store={store}>
      {!maintenance ? (
        <div className="maintenance">
          <h1>Site is currently under maintenance</h1>
        </div>
      ) : (
        <AppRoutes />
      )}
    </Provider>
  </React.StrictMode>
);
