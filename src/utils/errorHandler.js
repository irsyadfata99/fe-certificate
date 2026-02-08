import { HTTP_STATUS, ERROR_MESSAGES } from "./constants";
import toast from "react-hot-toast";
import { ENV } from "../config/env";

/**
 * Parse error response and extract message
 */
const parseErrorMessage = (error) => {
  // Check for response data message
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
 */
const isNetworkError = (error) => {
  return (
    error.isNetworkError ||
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK"
  );
};

/**
 * Check if error is a timeout error
 */
const isTimeoutError = (error) => {
  return error.code === "ECONNABORTED" || error.message?.includes("timeout");
};

/**
 * Check if error is cancellation
 */
const isCancelError = (error) => {
  return error.__CANCEL__ || error.message === "canceled";
};

/**
 * Get error category for better handling
 */
const getErrorCategory = (error) => {
  if (isCancelError(error)) return "CANCELLED";
  if (isNetworkError(error)) return "NETWORK";
  if (isTimeoutError(error)) return "TIMEOUT";

  const status = error.response?.status;
  if (!status) return "UNKNOWN";

  if (status === HTTP_STATUS.UNAUTHORIZED) return "UNAUTHORIZED";
  if (status === HTTP_STATUS.FORBIDDEN) return "FORBIDDEN";
  if (status === HTTP_STATUS.NOT_FOUND) return "NOT_FOUND";
  if (status === HTTP_STATUS.BAD_REQUEST) return "VALIDATION";
  if (status === HTTP_STATUS.CONFLICT) return "CONFLICT";
  if (status >= 500) return "SERVER";

  return "UNKNOWN";
};

/**
 * Main error handler with categorization
 */
export const handleApiError = (error, options = {}) => {
  const {
    customMessage = null,
    showToast = true,
    logError = ENV.IS_DEV,
  } = options;

  // Don't handle cancelled requests
  if (isCancelError(error)) {
    return null;
  }

  const category = getErrorCategory(error);
  const defaultMessage = parseErrorMessage(error);
  const message = customMessage || defaultMessage;

  // Log error in development
  if (logError) {
    console.error("API Error:", {
      category,
      message,
      status: error.response?.status,
      endpoint: error.config?.url,
      data: error.response?.data,
      stack: error.stack,
    });
  }

  // Show toast notification
  if (showToast) {
    switch (category) {
      case "NETWORK":
        toast.error(ERROR_MESSAGES.NETWORK_ERROR, {
          duration: 5000,
          icon: "🌐",
        });
        break;

      case "TIMEOUT":
        toast.error("Request timeout. Please try again.", {
          duration: 5000,
          icon: "⏱️",
        });
        break;

      case "UNAUTHORIZED":
        // Don't show toast for 401 - handled by axios interceptor
        break;

      case "FORBIDDEN":
        toast.error(message, {
          duration: 5000,
          icon: "🚫",
        });
        break;

      case "VALIDATION":
        toast.error(message, {
          duration: 4000,
          icon: "⚠️",
        });
        break;

      case "NOT_FOUND":
        toast.error(message, {
          duration: 4000,
          icon: "🔍",
        });
        break;

      case "CONFLICT":
        toast.error(message, {
          duration: 4000,
          icon: "⚠️",
        });
        break;

      case "SERVER":
        toast.error(ERROR_MESSAGES.SERVER_ERROR, {
          duration: 5000,
          icon: "❌",
        });
        break;

      default:
        toast.error(message, {
          duration: 4000,
        });
    }
  }

  return {
    category,
    message,
    status: error.response?.status,
    data: error.response?.data,
  };
};

/**
 * Extract error message from error object
 */
export const getErrorMessage = (error) => {
  return parseErrorMessage(error);
};

/**
 * Check if error needs retry
 */
export const shouldRetry = (error, retryCount = 0, maxRetries = 3) => {
  if (retryCount >= maxRetries) return false;
  if (isCancelError(error)) return false;

  const category = getErrorCategory(error);
  return (
    category === "NETWORK" || category === "TIMEOUT" || category === "SERVER"
  );
};

/**
 * Format validation errors from backend
 */
export const formatValidationErrors = (errorData) => {
  if (!errorData || !errorData.errors) return {};

  const formatted = {};
  Object.keys(errorData.errors).forEach((field) => {
    formatted[field] = errorData.errors[field].join(", ");
  });

  return formatted;
};
