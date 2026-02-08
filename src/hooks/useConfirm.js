import { useState, useCallback, useRef } from "react";

/**
 * useConfirm Hook
 * Manage confirmation dialogs with promise-based API
 *
 * @returns {Object} Confirm state and methods
 */
export const useConfirm = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default", // default, danger, warning, success
    onConfirm: null,
    onCancel: null,
  });

  // Store resolve/reject functions for promise-based API
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);

  // =====================================================
  // SHOW CONFIRMATION
  // =====================================================

  /**
   * Show confirmation dialog
   * @param {Object} options - Confirmation options
   * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false if cancelled
   */
  const confirm = useCallback((options = {}) => {
    const {
      title = "Confirm Action",
      message = "Are you sure you want to proceed?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "default",
      onConfirm = null,
      onCancel = null,
    } = options;

    setConfig({
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm,
      onCancel,
    });

    setIsOpen(true);

    // Return a promise that resolves when user confirms/cancels
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
    });
  }, []);

  // =====================================================
  // HANDLE CONFIRM
  // =====================================================

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(async () => {
    // Call custom onConfirm callback if provided
    if (config.onConfirm && typeof config.onConfirm === "function") {
      try {
        await config.onConfirm();
      } catch (error) {
        console.error("Confirm callback error:", error);
      }
    }

    // Resolve promise with true
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }

    // Close dialog
    setIsOpen(false);
  }, [config]);

  // =====================================================
  // HANDLE CANCEL
  // =====================================================

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(async () => {
    // Call custom onCancel callback if provided
    if (config.onCancel && typeof config.onCancel === "function") {
      try {
        await config.onCancel();
      } catch (error) {
        console.error("Cancel callback error:", error);
      }
    }

    // Resolve promise with false
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }

    // Close dialog
    setIsOpen(false);
  }, [config]);

  // =====================================================
  // PRESET CONFIRMATIONS
  // =====================================================

  /**
   * Show delete confirmation
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>}
   */
  const confirmDelete = useCallback(
    (options = {}) => {
      return confirm({
        title: "Confirm Delete",
        message:
          "Are you sure you want to delete this item? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
        ...options,
      });
    },
    [confirm],
  );

  /**
   * Show danger confirmation
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>}
   */
  const confirmDanger = useCallback(
    (options = {}) => {
      return confirm({
        title: "Warning",
        message: "This action may have serious consequences. Are you sure?",
        confirmText: "Continue",
        cancelText: "Cancel",
        variant: "danger",
        ...options,
      });
    },
    [confirm],
  );

  /**
   * Show warning confirmation
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>}
   */
  const confirmWarning = useCallback(
    (options = {}) => {
      return confirm({
        title: "Warning",
        message: "Please review this action carefully before proceeding.",
        confirmText: "Proceed",
        cancelText: "Cancel",
        variant: "warning",
        ...options,
      });
    },
    [confirm],
  );

  /**
   * Show success confirmation
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>}
   */
  const confirmSuccess = useCallback(
    (options = {}) => {
      return confirm({
        title: "Confirm",
        message: "Do you want to proceed with this action?",
        confirmText: "Yes",
        cancelText: "No",
        variant: "success",
        ...options,
      });
    },
    [confirm],
  );

  /**
   * Show custom confirmation with async action
   * @param {Object} options - Confirmation options with async action
   * @returns {Promise<boolean>}
   */
  const confirmAsync = useCallback(
    async (options = {}) => {
      const { action, ...restOptions } = options;

      const confirmed = await confirm(restOptions);

      if (confirmed && action && typeof action === "function") {
        try {
          await action();
          return true;
        } catch (error) {
          console.error("Async action error:", error);
          throw error;
        }
      }

      return confirmed;
    },
    [confirm],
  );

  // =====================================================
  // CLOSE DIALOG
  // =====================================================

  /**
   * Force close dialog (same as cancel)
   */
  const close = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    isOpen,
    config,

    // Actions
    confirm,
    handleConfirm,
    handleCancel,
    close,

    // Preset confirmations
    confirmDelete,
    confirmDanger,
    confirmWarning,
    confirmSuccess,
    confirmAsync,
  };
};

export default useConfirm;
