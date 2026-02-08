/**
 * Environment Configuration
 * Centralized environment variables with validation and type safety
 * All environment variables must start with VITE_ to be accessible
 */

/**
 * Get environment variable with default value
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 */
const getEnvVar = (key, defaultValue = "") => {
  const value = import.meta.env[key];
  if (value === undefined && !defaultValue) {
    console.warn(`⚠️ Environment variable ${key} is not defined`);
  }
  return value || defaultValue;
};

/**
 * Get boolean environment variable
 * @param {string} key - Environment variable key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Boolean value
 */
const getBoolEnvVar = (key, defaultValue = false) => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
};

/**
 * Get number environment variable
 * @param {string} key - Environment variable key
 * @param {number} defaultValue - Default value
 * @returns {number} Number value
 */
const getNumberEnvVar = (key, defaultValue = 0) => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Environment Configuration Object
 */
export const ENV = {
  // =====================================================
  // API CONFIGURATION
  // =====================================================
  API_BASE_URL: getEnvVar("VITE_API_BASE_URL", "http://localhost:3000/api"),
  API_TIMEOUT: getNumberEnvVar("VITE_API_TIMEOUT", 30000),

  // =====================================================
  // APP INFORMATION
  // =====================================================
  APP_NAME: getEnvVar("VITE_APP_NAME", "Certificate Management System"),
  APP_VERSION: getEnvVar("VITE_APP_VERSION", "1.0.0"),
  APP_DESCRIPTION: getEnvVar(
    "VITE_APP_DESCRIPTION",
    "Certificate and Module Management System",
  ),

  // =====================================================
  // ENVIRONMENT
  // =====================================================
  NODE_ENV: getEnvVar("VITE_NODE_ENV", import.meta.env.MODE),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,

  // =====================================================
  // FEATURE FLAGS
  // =====================================================
  ENABLE_LOGGING: getBoolEnvVar("VITE_ENABLE_LOGGING", true),
  ENABLE_ERROR_REPORTING: getBoolEnvVar("VITE_ENABLE_ERROR_REPORTING", false),

  // =====================================================
  // PAGINATION
  // =====================================================
  DEFAULT_PAGE_SIZE: getNumberEnvVar("VITE_DEFAULT_PAGE_SIZE", 10),
  MAX_PAGE_SIZE: getNumberEnvVar("VITE_MAX_PAGE_SIZE", 100),

  // =====================================================
  // SESSION
  // =====================================================
  SESSION_TIMEOUT: getNumberEnvVar("VITE_SESSION_TIMEOUT", 3600000), // 1 hour

  // =====================================================
  // TOAST NOTIFICATIONS
  // =====================================================
  TOAST_DURATION: getNumberEnvVar("VITE_TOAST_DURATION", 4000),
  TOAST_POSITION: getEnvVar("VITE_TOAST_POSITION", "top-right"),

  // =====================================================
  // FILE UPLOAD
  // =====================================================
  MAX_FILE_SIZE: getNumberEnvVar("VITE_MAX_FILE_SIZE", 5242880), // 5MB
};

/**
 * Validate required environment variables
 * @throws {Error} if validation fails
 */
export const validateEnv = () => {
  const errors = [];

  // Required variables
  const required = [
    { key: "VITE_API_BASE_URL", value: ENV.API_BASE_URL },
    { key: "VITE_APP_NAME", value: ENV.APP_NAME },
  ];

  // Check required variables
  required.forEach(({ key, value }) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Validate API URL format
  if (ENV.API_BASE_URL) {
    try {
      new URL(ENV.API_BASE_URL);
    } catch (e) {
      errors.push(`Invalid API URL format: ${ENV.API_BASE_URL}`);
    }
  }

  // Validate timeout
  if (ENV.API_TIMEOUT < 1000 || ENV.API_TIMEOUT > 120000) {
    errors.push(
      `API_TIMEOUT should be between 1000ms and 120000ms, got ${ENV.API_TIMEOUT}ms`,
    );
  }

  // Validate page size
  if (ENV.DEFAULT_PAGE_SIZE < 1 || ENV.DEFAULT_PAGE_SIZE > ENV.MAX_PAGE_SIZE) {
    errors.push(
      `DEFAULT_PAGE_SIZE should be between 1 and ${ENV.MAX_PAGE_SIZE}, got ${ENV.DEFAULT_PAGE_SIZE}`,
    );
  }

  // If there are errors, throw
  if (errors.length > 0) {
    const errorMessage = errors.join("\n");
    console.error("❌ Environment Validation Failed:\n", errorMessage);
    throw new Error(
      `Environment validation failed:\n${errorMessage}\n\nPlease check your .env file.`,
    );
  }

  // Log success in development
  if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
    console.log("✅ Environment variables validated successfully");
    console.log("📍 Environment:", ENV.MODE);
    console.log("🔗 API URL:", ENV.API_BASE_URL);
    console.log("⏱️ API Timeout:", `${ENV.API_TIMEOUT}ms`);
  }
};

/**
 * Get environment info for debugging
 * @returns {Object} Environment information
 */
export const getEnvironmentInfo = () => {
  return {
    appName: ENV.APP_NAME,
    appVersion: ENV.APP_VERSION,
    environment: ENV.MODE,
    apiUrl: ENV.API_BASE_URL,
    apiTimeout: ENV.API_TIMEOUT,
    isDevelopment: ENV.IS_DEV,
    isProduction: ENV.IS_PROD,
    features: {
      logging: ENV.ENABLE_LOGGING,
      errorReporting: ENV.ENABLE_ERROR_REPORTING,
    },
  };
};

/**
 * Log environment info (development only)
 */
export const logEnvironmentInfo = () => {
  if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
    console.group("🔧 Environment Configuration");
    console.table(getEnvironmentInfo());
    console.groupEnd();
  }
};

// Freeze ENV object to prevent modifications
Object.freeze(ENV);
