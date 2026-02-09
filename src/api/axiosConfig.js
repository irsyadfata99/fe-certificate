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
// REQUEST DEDUPLICATION - Smart Request Queue
// =====================================================

/**
 * PERMANENT SOLUTION: Request Deduplication
 *
 * Previous issue: Duplicate requests were being cancelled, causing "CanceledError"
 *
 * New approach:
 * - Share the same promise for duplicate concurrent requests
 * - Only make ONE actual HTTP request
 * - Return the same result to all callers
 * - Prevent unnecessary cancellations
 */

const pendingRequests = new Map();

/**
 * Generate unique key for request deduplication
 */
const generateRequestKey = (config) => {
  // Include method, url, and stringified params/data for unique key
  const params = config.params ? JSON.stringify(config.params) : "";
  const data = config.data ? JSON.stringify(config.data) : "";
  return `${config.method}:${config.url}:${params}:${data}`;
};

/**
 * Add request to pending queue with promise sharing
 * If duplicate request exists, return the existing promise
 */
const addPendingRequest = (config) => {
  const requestKey = generateRequestKey(config);

  // If identical request is already pending, return its promise
  if (pendingRequests.has(requestKey)) {
    const { promise } = pendingRequests.get(requestKey);

    ENV.ENABLE_LOGGING &&
      console.log(
        `♻️ Reusing pending request: ${config.method?.toUpperCase()} ${config.url}`,
      );

    // Mark this config as deduplicated so we can handle it differently
    config._isDeduplicated = true;
    config._sharedPromise = promise;

    return;
  }

  // Create new AbortController for this request
  const controller = new AbortController();
  config.signal = controller.signal;

  // Store both controller and a promise resolver
  pendingRequests.set(requestKey, {
    controller,
    promise: null, // Will be set in response interceptor
    requestKey,
  });
};

/**
 * Remove request from pending queue
 */
const removePendingRequest = (config) => {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
};

/**
 * Cancel all pending requests (for cleanup)
 */
export const cancelAllRequests = (message = "All requests cancelled") => {
  pendingRequests.forEach((value, key) => {
    const { controller } = value;
    controller.abort(message);
    ENV.ENABLE_LOGGING && console.log(`🚫 Cancelled request: ${key}`);
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

    // Handle request deduplication
    addPendingRequest(config);

    // If this is a deduplicated request, we'll handle it in response interceptor
    if (config._isDeduplicated) {
      ENV.ENABLE_LOGGING &&
        console.log(
          `♻️ ${config.method?.toUpperCase()} ${config.url} - Using cached promise`,
        );
    } else {
      // Log request in development
      if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
        console.log(
          `🔵 ${config.method?.toUpperCase()} ${config.url}`,
          config.data || config.params || "",
        );
      }
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
    const config = response.config;

    // If this was a deduplicated request, return the shared promise result
    if (config._isDeduplicated && config._sharedPromise) {
      ENV.ENABLE_LOGGING &&
        console.log(
          `✅ ${config.method?.toUpperCase()} ${config.url} - Returned from cache`,
        );
      return config._sharedPromise;
    }

    // Store response promise for deduplication
    const requestKey = generateRequestKey(config);
    if (pendingRequests.has(requestKey)) {
      const entry = pendingRequests.get(requestKey);
      entry.promise = Promise.resolve(response);
    }

    // Remove from pending requests after a short delay
    // This allows concurrent requests to reuse the result
    setTimeout(() => {
      removePendingRequest(config);
    }, 100);

    // Log success in development
    if (ENV.IS_DEV && ENV.ENABLE_LOGGING) {
      console.log(`✅ ${config.method?.toUpperCase()} ${config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // =====================================================
    // HANDLE DEDUPLICATED REQUESTS
    // =====================================================
    if (originalRequest?._isDeduplicated && originalRequest._sharedPromise) {
      // Return the shared promise (might be rejected)
      try {
        return await originalRequest._sharedPromise;
      } catch (sharedError) {
        // The original request failed, propagate the error
        return Promise.reject(sharedError);
      }
    }

    // Remove from pending requests
    if (originalRequest) {
      removePendingRequest(originalRequest);
    }

    // =====================================================
    // HANDLE CANCELLED REQUESTS
    // =====================================================
    if (axios.isCancel(error)) {
      ENV.ENABLE_LOGGING && console.log("🚫 Request Cancelled:", error.message);
      // Don't treat cancellation as an error - just return rejected promise
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
