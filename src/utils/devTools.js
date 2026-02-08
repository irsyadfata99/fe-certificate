/**
 * Development Utilities
 * Tools untuk verify environment dan configuration
 * Hanya untuk development mode
 */

import { ENV, validateEnv, getEnvironmentInfo } from "@config/env";
import axiosInstance from "@api/axiosConfig";
import { ENDPOINTS } from "@utils/constants";

// =====================================================
// ENVIRONMENT CHECKER
// =====================================================

/**
 * Check if environment is properly configured
 * @returns {Object} Check results
 */
export const checkEnvironment = () => {
  console.group("🔧 Environment Check");

  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    info: {},
  };

  try {
    // Validate environment
    validateEnv();
    console.log("✅ Environment variables valid");

    // Get environment info
    results.info = getEnvironmentInfo();
    console.log("📍 Environment:", results.info.environment);
    console.log("🔗 API URL:", results.info.apiUrl);
    console.log("⏱️ API Timeout:", results.info.apiTimeout + "ms");
    console.log("🌓 Dark Mode:", ENV.IS_DEV ? "Enabled" : "Disabled");
  } catch (error) {
    results.isValid = false;
    results.errors.push(error.message);
    console.error("❌ Environment validation failed:", error.message);
  }

  console.groupEnd();
  return results;
};

// =====================================================
// PATH ALIASES CHECKER (FIXED - Vite Compatible)
// =====================================================

/**
 * Test if path aliases are working
 * @returns {Object} Test results
 */
export const checkPathAliases = () => {
  console.group("🔍 Path Aliases Check");

  const results = {
    isValid: true,
    working: [],
    failed: [],
  };

  // Test actual imports instead of require.resolve
  const aliases = [
    { name: "@config/env", test: () => ENV !== undefined },
    { name: "@utils/constants", test: () => ENDPOINTS !== undefined },
    { name: "@api/axiosConfig", test: () => axiosInstance !== undefined },
  ];

  aliases.forEach(({ name, test }) => {
    try {
      if (test()) {
        results.working.push(name);
        console.log(`✅ ${name}`);
      } else {
        results.failed.push(name);
        console.error(`❌ ${name} - import failed`);
      }
    } catch (error) {
      results.isValid = false;
      results.failed.push(name);
      console.error(`❌ ${name} - ${error.message}`);
    }
  });

  if (results.isValid && results.failed.length === 0) {
    console.log("✅ All path aliases working correctly");
  } else {
    console.warn(
      "⚠️ Some path aliases failed. Check jsconfig.json and imports",
    );
  }

  console.groupEnd();
  return results;
};

// =====================================================
// API CONNECTION CHECKER
// =====================================================

/**
 * Test API connection and basic endpoints
 * @returns {Promise<Object>} Test results
 */
export const checkAPIConnection = async () => {
  console.group("🌐 API Connection Check");

  const results = {
    isConnected: false,
    baseURL: ENV.API_BASE_URL,
    tests: [],
  };

  try {
    // Test 1: Basic connectivity (health check jika ada)
    console.log("Testing API base URL:", ENV.API_BASE_URL);

    // Test dengan endpoint login (tanpa credentials, expect error 400/401)
    const response = await axiosInstance.post(ENDPOINTS.LOGIN, {});

    // Jika dapat response (even error response), berarti API reachable
    results.isConnected = true;
    console.log("✅ API is reachable");
  } catch (error) {
    // 400/401 berarti API reachable tapi request invalid (expected)
    if (error.response?.status === 400 || error.response?.status === 401) {
      results.isConnected = true;
      console.log("✅ API is reachable (got expected error response)");
    } else if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
      results.isConnected = false;
      console.error("❌ Cannot connect to API");
      console.error("   Make sure backend is running on:", ENV.API_BASE_URL);
    } else {
      results.isConnected = false;
      console.error("❌ API connection error:", error.message);
    }
  }

  console.groupEnd();
  return results;
};

// =====================================================
// AXIOS INTERCEPTORS CHECKER
// =====================================================

/**
 * Verify axios interceptors are properly configured
 * @returns {Object} Check results
 */
export const checkAxiosInterceptors = () => {
  console.group("⚙️ Axios Interceptors Check");

  const results = {
    request: axiosInstance.interceptors.request.handlers.length > 0,
    response: axiosInstance.interceptors.response.handlers.length > 0,
  };

  console.log(
    "Request Interceptors:",
    axiosInstance.interceptors.request.handlers.length,
  );
  console.log(
    "Response Interceptors:",
    axiosInstance.interceptors.response.handlers.length,
  );

  if (results.request && results.response) {
    console.log("✅ Axios interceptors configured correctly");
  } else {
    console.warn("⚠️ Axios interceptors might not be configured");
  }

  console.groupEnd();
  return results;
};

// =====================================================
// STORAGE CHECKER
// =====================================================

/**
 * Test localStorage and sessionStorage availability
 * @returns {Object} Check results
 */
export const checkStorage = () => {
  console.group("💾 Storage Check");

  const results = {
    localStorage: false,
    sessionStorage: false,
  };

  // Test localStorage
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    results.localStorage = true;
    console.log("✅ localStorage available");
  } catch (error) {
    console.error("❌ localStorage not available:", error.message);
  }

  // Test sessionStorage
  try {
    const testKey = "__storage_test__";
    sessionStorage.setItem(testKey, "test");
    sessionStorage.removeItem(testKey);
    results.sessionStorage = true;
    console.log("✅ sessionStorage available");
  } catch (error) {
    console.error("❌ sessionStorage not available:", error.message);
  }

  console.groupEnd();
  return results;
};

// =====================================================
// RUN ALL CHECKS
// =====================================================

/**
 * Run all development checks
 * @returns {Promise<Object>} All check results
 */
export const runAllChecks = async () => {
  console.log("🚀 Running development checks...\n");

  const results = {
    environment: checkEnvironment(),
    pathAliases: checkPathAliases(),
    storage: checkStorage(),
    axiosInterceptors: checkAxiosInterceptors(),
    apiConnection: null,
  };

  // API check (async)
  results.apiConnection = await checkAPIConnection();

  console.log("\n📊 Check Summary:");
  console.log(
    "Environment:",
    results.environment.isValid ? "✅ Valid" : "❌ Invalid",
  );
  console.log(
    "Path Aliases:",
    results.pathAliases.failed.length === 0 ? "✅ Working" : "❌ Failed",
  );
  console.log(
    "Storage:",
    results.storage.localStorage && results.storage.sessionStorage
      ? "✅ Available"
      : "⚠️ Limited",
  );
  console.log(
    "API Connection:",
    results.apiConnection.isConnected ? "✅ Connected" : "❌ Disconnected",
  );

  return results;
};

// =====================================================
// AUTO-RUN IN DEVELOPMENT
// =====================================================

// Automatically run checks in development mode
if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
  // Run checks after a short delay to avoid blocking initial render
  setTimeout(() => {
    runAllChecks();
  }, 1000);
}

export default {
  checkEnvironment,
  checkPathAliases,
  checkAPIConnection,
  checkAxiosInterceptors,
  checkStorage,
  runAllChecks,
};
