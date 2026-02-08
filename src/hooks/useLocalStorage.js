import { useState, useEffect, useCallback } from "react";
import { ENV } from "@config/env";

/**
 * useLocalStorage Hook
 * Manage localStorage with React state synchronization
 *
 * @param {string} key - LocalStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get value from localStorage
   */
  const getStoredValue = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item === null) {
        return initialValue;
      }

      // Try to parse JSON
      try {
        return JSON.parse(item);
      } catch {
        // If not JSON, return as string
        return item;
      }
    } catch (error) {
      ENV.ENABLE_LOGGING &&
        console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // =====================================================
  // STATE
  // =====================================================

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // =====================================================
  // SET VALUE
  // =====================================================

  /**
   * Set value in localStorage and state
   * @param {any} value - Value to store (or function that returns value)
   */
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Update state
        setStoredValue(valueToStore);

        // Update localStorage
        if (typeof window !== "undefined") {
          if (valueToStore === undefined || valueToStore === null) {
            window.localStorage.removeItem(key);
          } else {
            const serializedValue =
              typeof valueToStore === "string"
                ? valueToStore
                : JSON.stringify(valueToStore);
            window.localStorage.setItem(key, serializedValue);
          }
        }
      } catch (error) {
        ENV.ENABLE_LOGGING &&
          console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // =====================================================
  // REMOVE VALUE
  // =====================================================

  /**
   * Remove value from localStorage and reset to initial value
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      ENV.ENABLE_LOGGING &&
        console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // =====================================================
  // SYNC WITH STORAGE EVENTS
  // =====================================================

  useEffect(() => {
    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch {
          setStoredValue(e.newValue);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, [key, initialValue]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return [storedValue, setValue, removeValue];
};

/**
 * useSessionStorage Hook
 * Similar to useLocalStorage but uses sessionStorage
 *
 * @param {string} key - SessionStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export const useSessionStorage = (key, initialValue) => {
  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get value from sessionStorage
   */
  const getStoredValue = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);

      if (item === null) {
        return initialValue;
      }

      // Try to parse JSON
      try {
        return JSON.parse(item);
      } catch {
        // If not JSON, return as string
        return item;
      }
    } catch (error) {
      ENV.ENABLE_LOGGING &&
        console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // =====================================================
  // STATE
  // =====================================================

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // =====================================================
  // SET VALUE
  // =====================================================

  /**
   * Set value in sessionStorage and state
   * @param {any} value - Value to store (or function that returns value)
   */
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Update state
        setStoredValue(valueToStore);

        // Update sessionStorage
        if (typeof window !== "undefined") {
          if (valueToStore === undefined || valueToStore === null) {
            window.sessionStorage.removeItem(key);
          } else {
            const serializedValue =
              typeof valueToStore === "string"
                ? valueToStore
                : JSON.stringify(valueToStore);
            window.sessionStorage.setItem(key, serializedValue);
          }
        }
      } catch (error) {
        ENV.ENABLE_LOGGING &&
          console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // =====================================================
  // REMOVE VALUE
  // =====================================================

  /**
   * Remove value from sessionStorage and reset to initial value
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      ENV.ENABLE_LOGGING &&
        console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
