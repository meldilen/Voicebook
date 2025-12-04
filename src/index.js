import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./i18n";

function initializeApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.warn("Root element not found, retrying...");
    setTimeout(initializeApp, 50);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  initializeApp();
} else {
  document.addEventListener("DOMContentLoaded", initializeApp);
}
