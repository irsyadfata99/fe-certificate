import axios from "axios";
import { ENV } from "@config/env";
import { STORAGE_KEYS, HTTP_STATUS, ENDPOINTS } from "@utils/constants";

// =====================================================
// AXIOS INSTANCE
// =====================================================

const axiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST CANCELLATION - AbortController Registry
// =====================================================

const pendingRequests = new Map();

/**
 * Generate unique key for request
 */
const generateRequestKey = (config) => {
  return `${config.method}:${config.url}`;
};

/**
 * Add request to pending queue with AbortController
 */
const addPendingRequest = (config) => {
  const requestKey = generateRequestKey(config);

  // Cancel previous duplicate request
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller.abort("Duplicate request cancelled");
  }

  // Create new AbortController
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(requestKey, controller);
};

/**
 * Remove request from pending queue
 */
const removePendingRequest = (config) => {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
};

/**
 * Cancel all pending requests
 */
export const cancelAllRequests = (message = "All requests cancelled") => {
  pendingRequests.forEach((controller, key) => {
    controller.abort(message);
    ENV.ENABLE_LOGGING && console.log(`🚫 Cancelled request: ${key}`, message);
  });
  pendingRequests.clear();
};

// =====================================================
// RETRY MECHANISM
// =====================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Check if request should be retried
 */
const shouldRetry = (error, retryCount) => {
  // Don't retry if max retries reached
  if (retryCount >= MAX_RETRIES) return false;

  // Don't retry cancelled requests
  if (axios.isCancel(error)) return false;

  // Don't retry on client errors (except timeout)
  const status = error.response?.status;
  if (
    status &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 429
  ) {
    return false;
  }

  // Retry on network errors or specific status codes
  return !error.response || RETRY_STATUS_CODES.includes(status);
};

/**
 * Delay function for retry
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry request with exponential backoff
 */
const retryRequest = async (error) => {
  const config = error.config;

  // Initialize retry count
  if (!config.__retryCount) {
    config.__retryCount = 0;
  }

  // Check if should retry
  if (!shouldRetry(error, config.__retryCount)) {
    return Promise.reject(error);
  }

  // Increment retry count
  config.__retryCount += 1;

  // Calculate delay with exponential backoff
  const delayMs = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);

  ENV.ENABLE_LOGGING &&
    console.log(
      `🔄 Retrying request (${config.__retryCount}/${MAX_RETRIES}):`,
      config.url,
      `after ${delayMs}ms`,
    );

  // Wait before retry
  await delay(delayMs);

  // Retry request
  return axiosInstance(config);
};

// =====================================================
// TOKEN REFRESH - Queue Management
// =====================================================

let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Clear authentication data
 */
const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * Redirect to login
 */
const redirectToLogin = () => {
  // Cancel all pending requests before redirect
  cancelAllRequests("Session expired");

  // Clear auth data
  clearAuthData();

  // Redirect to login
  window.location.href = "/login";
};

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization token
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request to pending queue (for cancellation)
    addPendingRequest(config);

    // Log request in development
    if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
      console.log(
        `🔵 ${config.method?.toUpperCase()} ${config.url}`,
        config.data || config.params || "",
      );
    }

    return config;
  },
  (error) => {
    ENV.ENABLE_LOGGING && console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

axiosInstance.interceptors.response.use(
  (response) => {
    // Remove from pending requests
    removePendingRequest(response.config);

    // Log success in development
    if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        },
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Remove from pending requests
    if (originalRequest) {
      removePendingRequest(originalRequest);
    }

    // =====================================================
    // HANDLE CANCELLED REQUESTS
    // =====================================================
    if (axios.isCancel(error)) {
      ENV.ENABLE_LOGGING && console.log("🚫 Request Cancelled:", error.message);
      return Promise.reject(error);
    }

    // =====================================================
    // HANDLE NETWORK ERRORS
    // =====================================================
    if (!error.response) {
      ENV.ENABLE_LOGGING && console.error("🔴 Network Error:", error.message);

      // Try to retry network errors
      if (shouldRetry(error, originalRequest?.__retryCount || 0)) {
        return retryRequest(error);
      }

      return Promise.reject({
        ...error,
        message: "Network error. Please check your connection.",
        isNetworkError: true,
      });
    }

    // Log error in development
    if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
      console.error(
        `❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        {
          status: error.response.status,
          data: error.response.data,
        },
      );
    }

    // =====================================================
    // HANDLE 401 - TOKEN REFRESH
    // =====================================================
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      originalRequest.url !== ENDPOINTS.LOGIN &&
      originalRequest.url !== ENDPOINTS.REFRESH_TOKEN
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retry to prevent infinite loop
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      // No refresh token - logout
      if (!refreshToken) {
        ENV.ENABLE_LOGGING &&
          console.warn("⚠️ No refresh token found - logging out");
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Attempt token refresh
        const response = await axios.post(
          `${ENV.API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`,
          { refreshToken },
          { timeout: 10000 }, // 10s timeout for refresh
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Save new tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        ENV.ENABLE_LOGGING && console.log("✅ Token refreshed successfully");

        // Process queued requests with new token
        processQueue(null, accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        ENV.ENABLE_LOGGING &&
          console.error("❌ Token refresh failed:", refreshError);

        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // =====================================================
    // HANDLE RETRY FOR OTHER ERRORS
    // =====================================================
    if (shouldRetry(error, originalRequest?.__retryCount || 0)) {
      return retryRequest(error);
    }

    // =====================================================
    // HANDLE 403 - FORBIDDEN
    // =====================================================
    if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
      ENV.ENABLE_LOGGING &&
        console.warn("⚠️ Access forbidden:", error.response.data?.message);
    }

    return Promise.reject(error);
  },
);

// =====================================================
// CLEANUP ON PAGE UNLOAD
// =====================================================
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cancelAllRequests("Page unloading");
  });
}

export default axiosInstance;
