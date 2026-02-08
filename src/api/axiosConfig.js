import axios from "axios";
import { ENV } from "../config/env";
import { STORAGE_KEYS, HTTP_STATUS, ENDPOINTS } from "../utils/constants";

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
// ABORT CONTROLLER REGISTRY
// For request cancellation
// =====================================================

const pendingRequests = new Map();

const generateRequestKey = (config) => {
  return `${config.method}:${config.url}`;
};

const addPendingRequest = (config) => {
  const requestKey = generateRequestKey(config);

  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller.abort();
  }

  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(requestKey, controller);
};

const removePendingRequest = (config) => {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
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

    // Add request to pending (for cancellation)
    addPendingRequest(config);

    // Log in development
    if (ENV.IS_DEV) {
      console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    if (ENV.IS_DEV) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(error);
  },
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Remove from pending requests
    removePendingRequest(response.config);

    // Log in development
    if (ENV.IS_DEV) {
      console.log(
        `✅ ${response.config.method.toUpperCase()} ${response.config.url}`,
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

    // Handle request cancellation
    if (axios.isCancel(error)) {
      if (ENV.IS_DEV) {
        console.log("🚫 Request Cancelled:", error.message);
      }
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      if (ENV.IS_DEV) {
        console.error("🔴 Network Error:", error.message);
      }
      return Promise.reject({
        ...error,
        message: "Network error. Please check your connection.",
        isNetworkError: true,
      });
    }

    // Log error in development
    if (ENV.IS_DEV) {
      console.error(
        `❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        {
          status: error.response.status,
          data: error.response.data,
        },
      );
    }

    // Handle 401 - Token refresh
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      originalRequest.url !== ENDPOINTS.LOGIN &&
      originalRequest.url !== ENDPOINTS.REFRESH_TOKEN
    ) {
      if (isRefreshing) {
        // Add to queue
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

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        // No refresh token - logout
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${ENV.API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Save new tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        processQueue(refreshError, null);
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
      // User doesn't have permission - could redirect or show message
      return Promise.reject({
        ...error,
        message: error.response.data?.message || "Access denied",
      });
    }

    return Promise.reject(error);
  },
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

// Cancel all pending requests
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort();
  });
  pendingRequests.clear();
};

export default axiosInstance;
