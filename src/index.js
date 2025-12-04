import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./i18n";

function startApp() {
  let rootElement = document.getElementById("root");

  if (!rootElement) {
    console.warn("Element #root not found, checking alternatives...");

    const possibleSelectors = [
      "#root",
      "#app",
      "#main",
      "[data-app]",
      ".app-container",
      "body > div:first-child",
    ];

    for (const selector of possibleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        rootElement = el;
        console.log(`Found element with selector: ${selector}`);
        break;
      }
    }

    if (!rootElement) {
      console.warn("No root element found, creating one...");
      rootElement = document.createElement("div");
      rootElement.id = "root";

      const container =
        document.querySelector("body") || document.documentElement;
      if (container) {
        container.appendChild(rootElement);
        console.log("Created root element");
      } else {
        console.error("No container found for root!");
        return;
      }
    }
  }

  console.log("Mounting React to:", rootElement);

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ React app mounted successfully!");
  } catch (error) {
    console.error("❌ Failed to mount React:", error);
  }
}

setTimeout(() => {
  if (document.body) {
    startApp();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(startApp, 100);
    });
  }
}, 300);
