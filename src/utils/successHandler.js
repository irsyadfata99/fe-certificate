import toast from "react-hot-toast";

/**
 * Standardized success handler
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 */
export const handleSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    ...options,
  });

  // Log in development
  if (import.meta.env.DEV) {
    console.log("✅ Success:", message);
  }
};
