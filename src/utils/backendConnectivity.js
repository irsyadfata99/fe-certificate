/**
 * Backend Connectivity Checker
 * Test if frontend can successfully connect to backend API
 */

import axiosInstance from "@api/axiosConfig";
import { ENDPOINTS } from "@utils/constants";
import { ENV } from "@config/env";

/**
 * Test basic API connectivity
 * @returns {Promise<Object>} Connection test results
 */
export const testBackendConnection = async () => {
  const results = {
    isConnected: false,
    baseURL: ENV.API_BASE_URL,
    timestamp: new Date().toISOString(),
    tests: [],
  };

  console.group("🌐 Backend Connection Test");
  console.log("Testing API at:", ENV.API_BASE_URL);
  console.log("Timeout:", ENV.API_TIMEOUT, "ms");

  // Test 1: API Reachability
  try {
    console.log("\n1️⃣ Testing API reachability...");

    // Try to hit login endpoint (will return 400/401 without credentials, but that means API is reachable)
    await axiosInstance.post(ENDPOINTS.LOGIN, {});

    results.tests.push({
      name: "API Reachability",
      status: "pass",
      message: "API is reachable",
    });
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      // Expected error - API is reachable
      results.isConnected = true;
      results.tests.push({
        name: "API Reachability",
        status: "pass",
        message: "API is reachable (got expected error response)",
      });
      console.log("✅ API is reachable");
    } else if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
      // Cannot connect
      results.tests.push({
        name: "API Reachability",
        status: "fail",
        message: "Cannot connect to API",
        error: error.message,
      });
      console.error("❌ Cannot connect to API");
      console.error("   Make sure backend is running at:", ENV.API_BASE_URL);
    } else {
      // Other error
      results.tests.push({
        name: "API Reachability",
        status: "fail",
        message: "API connection error",
        error: error.message,
      });
      console.error("❌ API error:", error.message);
    }
  }

  // Test 2: CORS Configuration
  try {
    console.log("\n2️⃣ Testing CORS configuration...");

    const response = await axiosInstance.options(ENDPOINTS.LOGIN);

    if (
      response.headers["access-control-allow-origin"] ||
      response.status === 204
    ) {
      results.tests.push({
        name: "CORS Configuration",
        status: "pass",
        message: "CORS is properly configured",
      });
      console.log("✅ CORS is properly configured");
    }
  } catch (error) {
    // CORS errors might not be catchable in all scenarios
    if (error.message?.includes("CORS")) {
      results.tests.push({
        name: "CORS Configuration",
        status: "fail",
        message: "CORS error detected",
        error: error.message,
      });
      console.error("❌ CORS error:", error.message);
    } else {
      results.tests.push({
        name: "CORS Configuration",
        status: "warning",
        message: "Could not verify CORS (might be OK)",
      });
      console.warn("⚠️ Could not verify CORS");
    }
  }

  // Test 3: Response Format
  try {
    console.log("\n3️⃣ Testing response format...");

    // Try login with invalid credentials - should get consistent error format
    await axiosInstance.post(ENDPOINTS.LOGIN, {
      username: "test",
      password: "test",
    });
  } catch (error) {
    if (error.response?.data?.success === false) {
      results.tests.push({
        name: "Response Format",
        status: "pass",
        message: "Backend returns consistent JSON format",
      });
      console.log("✅ Response format is correct");
    } else {
      results.tests.push({
        name: "Response Format",
        status: "warning",
        message: "Response format might be inconsistent",
      });
      console.warn("⚠️ Response format check inconclusive");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 CONNECTION TEST SUMMARY");
  console.log("=".repeat(60));
  console.table(
    results.tests.map((t) => ({
      Test: t.name,
      Status: t.status.toUpperCase(),
      Message: t.message,
    })),
  );

  const allPassed = results.tests.every((t) => t.status === "pass");
  const hasCriticalFail = results.tests.some(
    (t) => t.status === "fail" && t.name === "API Reachability",
  );

  if (allPassed) {
    console.log("\n✅ ALL TESTS PASSED - Backend connection is healthy");
    results.isConnected = true;
  } else if (hasCriticalFail) {
    console.log("\n❌ CRITICAL FAILURE - Cannot connect to backend API");
    console.log("   Please ensure:");
    console.log("   1. Backend server is running");
    console.log("   2. Backend is listening on:", ENV.API_BASE_URL);
    console.log("   3. No firewall blocking the connection");
    results.isConnected = false;
  } else {
    console.log("\n⚠️ SOME TESTS FAILED - Connection works but with warnings");
    results.isConnected = true;
  }

  console.log("=".repeat(60));
  console.groupEnd();

  return results;
};

/**
 * Test specific endpoint
 * @param {string} endpoint - Endpoint to test
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Test result
 */
export const testEndpoint = async (endpoint, method = "GET", data = null) => {
  try {
    console.log(`Testing ${method} ${endpoint}...`);

    let response;
    switch (method.toUpperCase()) {
      case "GET":
        response = await axiosInstance.get(endpoint);
        break;
      case "POST":
        response = await axiosInstance.post(endpoint, data);
        break;
      case "PUT":
        response = await axiosInstance.put(endpoint, data);
        break;
      case "DELETE":
        response = await axiosInstance.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    console.log(`✅ ${method} ${endpoint} - Success`);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} - Failed:`, error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.message,
      data: error.response?.data,
    };
  }
};

/**
 * Quick health check (non-intrusive)
 * @returns {Promise<boolean>} True if backend is healthy
 */
export const quickHealthCheck = async () => {
  try {
    // Simple OPTIONS request to check if API is up
    await axiosInstance.options(ENDPOINTS.LOGIN);
    return true;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 401) {
      // API responded, just endpoint not available
      return true;
    }
    return false;
  }
};

/**
 * Display connection status in console (for development)
 */
export const logConnectionStatus = async () => {
  if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
    console.log("🔍 Checking backend connection...");
    const isHealthy = await quickHealthCheck();

    if (isHealthy) {
      console.log("✅ Backend is connected and healthy");
      console.log("   API URL:", ENV.API_BASE_URL);
    } else {
      console.error("❌ Backend is not reachable");
      console.error("   API URL:", ENV.API_BASE_URL);
      console.error("   Please start the backend server");
    }
  }
};

export default {
  testBackendConnection,
  testEndpoint,
  quickHealthCheck,
  logConnectionStatus,
};
