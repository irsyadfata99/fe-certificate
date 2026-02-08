import { HTTP_STATUS, ERROR_MESSAGES } from "@utils/constants";
import toast from "react-hot-toast";
import { ENV } from "@config/env";
import axios from "axios";

// =====================================================
// ERROR CATEGORIES
// =====================================================

export const ERROR_CATEGORY = {
  NETWORK: "NETWORK",
  TIMEOUT: "TIMEOUT",
  CANCELLED: "CANCELLED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  CONFLICT: "CONFLICT",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
};

// =====================================================
// ERROR PARSERS
// =====================================================

/**
 * Parse error message from error object
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
const parseErrorMessage = (error) => {
  // Check for response data message (backend error)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for error message
  if (error.message) {
    return error.message;
  }

  return ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return (
    error.isNetworkError ||
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    error.message?.toLowerCase().includes("network")
  );
};

/**
 * Check if error is a timeout error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isTimeoutError = (error) => {
  return (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT" ||
    error.message?.toLowerCase().includes("timeout")
  );
};

/**
 * Check if error is a cancellation
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isCancelError = (error) => {
  return axios.isCancel(error) || error.message === "canceled";
};

/**
 * Get error category for better handling
 * @param {Error} error - Error object
 * @returns {string} Error category
 */
export const getErrorCategory = (error) => {
  // Check cancellation first
  if (isCancelError(error)) return ERROR_CATEGORY.CANCELLED;

  // Check network/timeout
  if (isNetworkError(error)) return ERROR_CATEGORY.NETWORK;
  if (isTimeoutError(error)) return ERROR_CATEGORY.TIMEOUT;

  // Check HTTP status
  const status = error.response?.status;
  if (!status) return ERROR_CATEGORY.UNKNOWN;

  if (status === HTTP_STATUS.UNAUTHORIZED) return ERROR_CATEGORY.UNAUTHORIZED;
  if (status === HTTP_STATUS.FORBIDDEN) return ERROR_CATEGORY.FORBIDDEN;
  if (status === HTTP_STATUS.NOT_FOUND) return ERROR_CATEGORY.NOT_FOUND;
  if (status === HTTP_STATUS.BAD_REQUEST) return ERROR_CATEGORY.VALIDATION;
  if (status === HTTP_STATUS.CONFLICT) return ERROR_CATEGORY.CONFLICT;
  if (status >= 500) return ERROR_CATEGORY.SERVER;

  return ERROR_CATEGORY.UNKNOWN;
};

// =====================================================
// TOAST CONFIGURATIONS PER ERROR CATEGORY
// =====================================================

const TOAST_CONFIG = {
  [ERROR_CATEGORY.NETWORK]: {
    message: ERROR_MESSAGES.NETWORK_ERROR,
    icon: "🌐",
    duration: 5000,
  },
  [ERROR_CATEGORY.TIMEOUT]: {
    message: "Request timeout. Please try again.",
    icon: "⏱️",
    duration: 5000,
  },
  [ERROR_CATEGORY.UNAUTHORIZED]: {
    // Handled by axios interceptor - no toast
    showToast: false,
  },
  [ERROR_CATEGORY.FORBIDDEN]: {
    icon: "🚫",
    duration: 5000,
  },
  [ERROR_CATEGORY.VALIDATION]: {
    icon: "⚠️",
    duration: 4000,
  },
  [ERROR_CATEGORY.NOT_FOUND]: {
    icon: "🔍",
    duration: 4000,
  },
  [ERROR_CATEGORY.CONFLICT]: {
    icon: "⚠️",
    duration: 4000,
  },
  [ERROR_CATEGORY.SERVER]: {
    message: ERROR_MESSAGES.SERVER_ERROR,
    icon: "❌",
    duration: 5000,
  },
  [ERROR_CATEGORY.UNKNOWN]: {
    icon: "⚠️",
    duration: 4000,
  },
};

// =====================================================
// MAIN ERROR HANDLER
// =====================================================

/**
 * Main API error handler with categorization and toast notifications
 * @param {Error} error - Error object
 * @param {Object} options - Handler options
 * @returns {Object|null} Error information or null if cancelled
 */
export const handleApiError = (error, options = {}) => {
  const {
    customMessage = null,
    showToast = true,
    logError = ENV.IS_DEV && ENV.ENABLE_LOGGING,
    onError = null,
  } = options;

  // Don't handle cancelled requests
  if (isCancelError(error)) {
    logError && console.log("🚫 Request cancelled:", error.message);
    return null;
  }

  // Get error category and message
  const category = getErrorCategory(error);
  const defaultMessage = parseErrorMessage(error);
  const message = customMessage || defaultMessage;

  // Prepare error info
  const errorInfo = {
    category,
    message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    endpoint: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    timestamp: new Date().toISOString(),
  };

  // Log error in development
  if (logError) {
    console.group(`❌ API Error [${category}]`);
    console.error("Message:", message);
    console.error("Status:", errorInfo.status || "N/A");
    console.error("Endpoint:", errorInfo.endpoint || "N/A");
    console.error("Method:", errorInfo.method || "N/A");
    if (error.response?.data) {
      console.error("Response Data:", error.response.data);
    }
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    console.groupEnd();
  }

  // Show toast notification
  if (showToast) {
    const config =
      TOAST_CONFIG[category] || TOAST_CONFIG[ERROR_CATEGORY.UNKNOWN];

    if (config.showToast !== false) {
      const toastMessage = config.message || message;
      const toastOptions = {
        duration: config.duration || 4000,
        ...(config.icon && { icon: config.icon }),
      };

      toast.error(toastMessage, toastOptions);
    }
  }

  // Call custom error handler if provided
  if (onError && typeof onError === "function") {
    onError(errorInfo);
  }

  // Report to error tracking service (if enabled)
  if (ENV.ENABLE_ERROR_REPORTING && ENV.IS_PROD) {
    reportToErrorTracking(errorInfo);
  }

  return errorInfo;
};

// =====================================================
// ERROR TRACKING (Placeholder for future implementation)
// =====================================================

/**
 * Report error to tracking service (Sentry, LogRocket, etc.)
 * @param {Object} errorInfo - Error information
 */
const reportToErrorTracking = (errorInfo) => {
  // TODO: Implement error tracking service integration
  // Example: Sentry.captureException(errorInfo);
  console.log("📊 Error tracking:", errorInfo);
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Extract error message from error object
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  return parseErrorMessage(error);
};

/**
 * Check if error needs retry
 * @param {Error} error - Error object
 * @param {number} retryCount - Current retry count
 * @param {number} maxRetries - Maximum retries
 * @returns {boolean}
 */
export const shouldRetry = (error, retryCount = 0, maxRetries = 3) => {
  if (retryCount >= maxRetries) return false;
  if (isCancelError(error)) return false;

  const category = getErrorCategory(error);
  return (
    category === ERROR_CATEGORY.NETWORK ||
    category === ERROR_CATEGORY.TIMEOUT ||
    category === ERROR_CATEGORY.SERVER
  );
};

/**
 * Format validation errors from backend
 * @param {Object} errorData - Error data from backend
 * @returns {Object} Formatted validation errors
 */
export const formatValidationErrors = (errorData) => {
  if (!errorData || !errorData.errors) return {};

  const formatted = {};
  Object.keys(errorData.errors).forEach((field) => {
    const errors = errorData.errors[field];
    formatted[field] = Array.isArray(errors) ? errors.join(", ") : errors;
  });

  return formatted;
};

/**
 * Create error object for consistent error handling
 * @param {string} message - Error message
 * @param {string} category - Error category
 * @param {Object} details - Additional details
 * @returns {Object} Error object
 */
export const createError = (
  message,
  category = ERROR_CATEGORY.UNKNOWN,
  details = {},
) => {
  return {
    message,
    category,
    timestamp: new Date().toISOString(),
    ...details,
  };
};

/**
 * Check if response indicates success
 * @param {Object} response - API response
 * @returns {boolean}
 */
export const isSuccessResponse = (response) => {
  return (
    response?.data?.success === true ||
    (response?.status >= 200 && response?.status < 300)
  );
};

/**
 * Extract data from success response
 * @param {Object} response - API response
 * @returns {any} Response data
 */
export const extractResponseData = (response) => {
  return response?.data?.data || response?.data || null;
};
