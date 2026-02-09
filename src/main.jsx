import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import ErrorBoundary from "./components/error/ErrorBoundary";
import { validateEnv } from "./config/env";
import "./index.css";

// Import dev tools (akan auto-run checks dalam development)
import "./utils/devTools";

// Validate environment variables before app starts
try {
  validateEnv();
} catch (error) {
  console.error("Environment validation failed:", error.message);
  document.getElementById("root").innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center; max-width: 500px; padding: 20px;">
        <h1 style="color: #dc2626;">Configuration Error</h1>
        <p style="color: #6b7280;">${error.message}</p>
        <p style="color: #6b7280; margin-top: 20px;">Please check your .env file and restart the application.</p>
      </div>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            // Dark mode support - menggunakan CSS variables
            className: "",
            style: {
              background: "var(--toast-bg, #ffffff)",
              color: "var(--toast-text, #1f2937)",
              fontSize: "14px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--toast-border, #e5e7eb)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
              style: {
                background: "var(--toast-success-bg, #ecfdf5)",
                color: "var(--toast-success-text, #065f46)",
                border: "1px solid var(--toast-success-border, #a7f3d0)",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#ffffff",
              },
              style: {
                background: "var(--toast-error-bg, #fef2f2)",
                color: "var(--toast-error-text, #991b1b)",
                border: "1px solid var(--toast-error-border, #fca5a5)",
              },
            },
            loading: {
              duration: Infinity,
              iconTheme: {
                primary: "#3b82f6",
                secondary: "#ffffff",
              },
              style: {
                background: "var(--toast-loading-bg, #eff6ff)",
                color: "var(--toast-loading-text, #1e40af)",
                border: "1px solid var(--toast-loading-border, #bfdbfe)",
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
