import "core-js/stable";
import "regenerator-runtime/runtime";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// DEV-only: polyfill navigator.modelContext and connect the mcp-b local relay
// so external MCP clients (Claude Code) can call the page's WebMCP tools.
if (import.meta.env.DEV) {
  try {
    const { setupDevRelay } = await import("./mcp/devRelay");
    await setupDevRelay();
  } catch (error) {
    console.warn("[WebMCP] dev relay setup failed", error);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
