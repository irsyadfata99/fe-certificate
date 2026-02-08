import { useState, useEffect, useRef } from "react";
import { DEBOUNCE_DELAY } from "@utils/constants";

/**
 * useDebounce Hook
 * Debounce a value with configurable delay
 *
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = DEBOUNCE_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout on value change or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useDebouncedCallback Hook
 * Debounce a callback function
 *
 * @param {Function} callback - Callback function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} Debounced callback
 */
export const useDebouncedCallback = (
  callback,
  delay = DEBOUNCE_DELAY,
  dependencies = [],
) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Return debounced function
  const debouncedCallback = (...args) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };

  // Add cancel method to debounced function
  debouncedCallback.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return debouncedCallback;
};

/**
 * useThrottle Hook
 * Throttle a value with configurable delay
 *
 * @param {any} value - Value to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Throttled value
 */
export const useThrottle = (value, delay = DEBOUNCE_DELAY) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecuted.current;

        if (timeSinceLastExecution >= delay) {
          lastExecuted.current = now;
          setThrottledValue(value);
        }
      },
      delay - (Date.now() - lastExecuted.current),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

/**
 * useThrottledCallback Hook
 * Throttle a callback function
 *
 * @param {Function} callback - Callback function to throttle
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} Throttled callback
 */
export const useThrottledCallback = (
  callback,
  delay = DEBOUNCE_DELAY,
  dependencies = [],
) => {
  const lastExecuted = useRef(Date.now());
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...dependencies]);

  // Return throttled function
  const throttledCallback = (...args) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= delay) {
      lastExecuted.current = now;
      callbackRef.current(...args);
    }
  };

  return throttledCallback;
};

export default useDebounce;
