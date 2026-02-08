import { HTTP_STATUS, ERROR_MESSAGES } from "./constants";
import toast from "react-hot-toast";

/**
 * Standardized error handler
 * @param {Error} error - Error object from axios
 * @param {string} customMessage - Optional custom error message
 * @returns {string} Error message
 */
export const handleApiError = (error, customMessage = null) => {
  // Network error (no response from server)
  if (!error.response) {
    const message = customMessage || ERROR_MESSAGES.NETWORK_ERROR;
    toast.error(message);
    return message;
  }

  const { status, data } = error.response;

  // Get error message from response or use default
  let message = data?.message || ERROR_MESSAGES.SERVER_ERROR;

  // Handle specific status codes
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      message =
        customMessage || data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
      break;

    case HTTP_STATUS.UNAUTHORIZED:
      message = customMessage || ERROR_MESSAGES.UNAUTHORIZED;
      break;

    case HTTP_STATUS.FORBIDDEN:
      message = customMessage || ERROR_MESSAGES.FORBIDDEN;
      break;

    case HTTP_STATUS.NOT_FOUND:
      message = customMessage || ERROR_MESSAGES.NOT_FOUND;
      break;

    case HTTP_STATUS.CONFLICT:
      message = customMessage || data?.message || "Resource already exists.";
      break;

    case HTTP_STATUS.SERVER_ERROR:
      message = customMessage || ERROR_MESSAGES.SERVER_ERROR;
      break;

    default:
      message = customMessage || data?.message || ERROR_MESSAGES.SERVER_ERROR;
  }

  // Show toast notification
  toast.error(message);

  // Log error in development
  if (import.meta.env.DEV) {
    console.error("API Error:", {
      status,
      message,
      data,
      endpoint: error.config?.url,
    });
  }

  return message;
};

/**
 * Extract error message from error object
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    ERROR_MESSAGES.SERVER_ERROR
  );
};
