import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import AppRoutes from "./Containers/AppRoutes";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const maintenance = process.env.REACT_APP_MAINTENANCE || false;

console.log("maintenance", maintenance);

root.render(
  <React.StrictMode>
    {!maintenance ? (
      <div className="maintenance">
        <h1>Site is currently under maintenance</h1>
      </div>
    ) : (
      <AppRoutes />
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
