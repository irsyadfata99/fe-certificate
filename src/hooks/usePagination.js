import { useState, useCallback, useMemo } from "react";
import { PAGINATION } from "@utils/constants";

/**
 * usePagination Hook
 * Manage pagination state and calculations
 *
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = PAGINATION.DEFAULT_LIMIT,
    total = 0,
  } = options;

  // =====================================================
  // STATE
  // =====================================================

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(total);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1;
  }, [totalItems, pageSize]);

  /**
   * Calculate offset for API calls (zero-based)
   */
  const offset = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  /**
   * Check if there's a next page
   */
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  /**
   * Check if there's a previous page
   */
  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * Get current page range (e.g., "1-10 of 100")
   */
  const pageRange = useMemo(() => {
    if (totalItems === 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const start = offset + 1;
    const end = Math.min(offset + pageSize, totalItems);

    return { start, end, total: totalItems };
  }, [offset, pageSize, totalItems]);

  /**
   * Get page range text (e.g., "1-10 of 100 items")
   */
  const pageRangeText = useMemo(() => {
    const { start, end, total } = pageRange;

    if (total === 0) {
      return "No items";
    }

    return `${start}-${end} of ${total} items`;
  }, [pageRange]);

  // =====================================================
  // ACTIONS
  // =====================================================

  /**
   * Go to specific page
   * @param {number} page - Page number (1-based)
   */
  const goToPage = useCallback(
    (page) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages],
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Change page size and reset to first page
   * @param {number} size - New page size
   */
  const changePageSize = useCallback((size) => {
    const validSize = Math.max(1, Math.min(size, PAGINATION.MAX_LIMIT));
    setPageSize(validSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  /**
   * Update total items (usually from API response)
   * @param {number} total - Total number of items
   */
  const updateTotal = useCallback(
    (total) => {
      setTotalItems(total);

      // If current page exceeds new total pages, go to last page
      const newTotalPages = Math.ceil(total / pageSize) || 1;
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    },
    [currentPage, pageSize],
  );

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotalItems(total);
  }, [initialPage, initialPageSize, total]);

  /**
   * Get pagination parameters for API calls
   * @returns {Object} { limit, offset }
   */
  const getPaginationParams = useCallback(() => {
    return {
      limit: pageSize,
      offset: offset,
    };
  }, [pageSize, offset]);

  /**
   * Generate page numbers for pagination UI
   * @param {number} maxVisible - Maximum number of visible page buttons
   * @returns {Array<number|string>} Array of page numbers or '...'
   */
  const getPageNumbers = useCallback(
    (maxVisible = 5) => {
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const pages = [];
      const halfVisible = Math.floor(maxVisible / 2);

      let startPage = Math.max(currentPage - halfVisible, 1);
      let endPage = Math.min(startPage + maxVisible - 1, totalPages);

      // Adjust start if we're near the end
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(endPage - maxVisible + 1, 1);
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }

      return pages;
    },
    [currentPage, totalPages],
  );

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    offset,

    // Computed
    hasNextPage,
    hasPreviousPage,
    pageRange,
    pageRangeText,

    // Navigation
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,

    // Configuration
    changePageSize,
    updateTotal,
    reset,

    // Utilities
    getPaginationParams,
    getPageNumbers,
  };
};

export default usePagination;
