/**
 * Environment Configuration
 * Centralized environment variables with validation
 */

const getEnvVar = (key, defaultValue = "") => {
  const value = import.meta.env[key];
  if (value === undefined && !defaultValue) {
    console.warn(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue;
};

export const ENV = {
  // API
  API_BASE_URL: getEnvVar("VITE_API_BASE_URL", "http://localhost:3000/api"),
  API_TIMEOUT: parseInt(getEnvVar("VITE_API_TIMEOUT", "30000")),

  // App
  APP_NAME: getEnvVar("VITE_APP_NAME", "Certificate Management System"),
  APP_VERSION: getEnvVar("VITE_APP_VERSION", "1.0.0"),

  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

// Validate required environment variables
export const validateEnv = () => {
  const required = ["VITE_API_BASE_URL"];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env file.",
    );
  }

  console.log("✅ Environment variables validated");
};
