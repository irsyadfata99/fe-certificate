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
            style: {
              background: "#fff",
              color: "#363636",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
