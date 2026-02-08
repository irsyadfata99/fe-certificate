import { useState, useCallback, useEffect, useRef } from "react";
import { handleApiError } from "@utils/errorHandler";
import { ENV } from "@config/env";

/**
 * useApi Hook
 * Generic hook for API calls with loading, error, and data states
 *
 * @param {Function} apiFunction - API function to call
 * @param {Object} options - Hook options
 * @returns {Object} API state and methods
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess = null,
    onError = null,
    showErrorToast = true,
    initialData = null,
  } = options;

  // =====================================================
  // STATE
  // =====================================================

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Track the latest request to prevent race conditions
  const latestRequestId = useRef(0);

  // =====================================================
  // CLEANUP ON UNMOUNT
  // =====================================================

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // =====================================================
  // EXECUTE API CALL
  // =====================================================

  /**
   * Execute the API function
   * @param {...any} args - Arguments to pass to API function
   * @returns {Promise} API response
   */
  const execute = useCallback(
    async (...args) => {
      // Increment request ID
      const requestId = ++latestRequestId.current;

      // Reset state
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        ENV.ENABLE_LOGGING &&
          console.log("🔄 API call started:", apiFunction.name);

        // Execute API function
        const response = await apiFunction(...args);

        // Only update state if this is the latest request and component is mounted
        if (requestId === latestRequestId.current && isMounted.current) {
          // Extract data from response
          const responseData = response?.data || response;

          setData(responseData);
          setIsSuccess(true);
          setError(null);

          ENV.ENABLE_LOGGING &&
            console.log("✅ API call success:", apiFunction.name);

          // Call success callback
          if (onSuccess && typeof onSuccess === "function") {
            onSuccess(responseData, response);
          }

          return response;
        }
      } catch (err) {
        ENV.ENABLE_LOGGING &&
          console.error("❌ API call error:", apiFunction.name, err);

        // Only update state if this is the latest request and component is mounted
        if (requestId === latestRequestId.current && isMounted.current) {
          const errorInfo = handleApiError(err, {
            showToast: showErrorToast,
          });

          setError(errorInfo || err);
          setIsSuccess(false);

          // Call error callback
          if (onError && typeof onError === "function") {
            onError(errorInfo || err);
          }

          throw err;
        }
      } finally {
        // Only update loading state if this is the latest request and component is mounted
        if (requestId === latestRequestId.current && isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [apiFunction, onSuccess, onError, showErrorToast],
  );

  // =====================================================
  // RESET STATE
  // =====================================================

  /**
   * Reset all states to initial values
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  }, [initialData]);

  // =====================================================
  // MANUAL DATA UPDATE
  // =====================================================

  /**
   * Manually update data without API call
   * @param {any} newData - New data to set
   */
  const setDataManually = useCallback((newData) => {
    setData(newData);
    setIsSuccess(true);
    setError(null);
  }, []);

  // =====================================================
  // IMMEDIATE EXECUTION
  // =====================================================

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    data,
    error,
    isLoading,
    isSuccess,
    isError: error !== null,

    // Methods
    execute,
    reset,
    setData: setDataManually,

    // Computed
    hasData: data !== null && data !== undefined,
  };
};

export default useApi;
