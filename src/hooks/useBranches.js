import { useState, useEffect, useCallback } from "react";
import { getActiveBranches } from "@api/branchApi";

/**
 * Custom hook for fetching and managing dynamic branches
 * @returns {Object} { branches, loading, error, refetch }
 */
export const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getActiveBranches();

      if (response.success) {
        const branchData = response.data || [];
        setBranches(branchData);
      } else {
        throw new Error(response.message || "Failed to fetch branches");
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      setError(err.message || "Failed to load branches");
      // Fallback to empty array on error
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    branches,
    loading,
    error,
    refetch: fetchBranches,
  };
};

/**
 * Custom hook for branch options (for select/dropdown)
 * Transforms branch data into { value, label, id } format
 * CRITICAL: Includes 'id' field for backend conversion
 * @returns {Object} { branchOptions, loading, error }
 */
export const useBranchOptions = () => {
  const { branches, loading, error, refetch } = useBranches();

  const branchOptions = branches.map((branch) => ({
    value: branch.branch_code, // Used for react-select value
    label: branch.branch_name, // Used for display
    id: branch.id, // ✅ CRITICAL: Used for API payload conversion
    isActive: branch.is_active,
  }));

  return {
    branchOptions,
    branches,
    loading,
    error,
    refetch,
  };
};

/**
 * Custom hook to get branch details by code
 * @param {string} branchCode - Branch code to find
 * @returns {Object} { branch, loading, error }
 */
export const useBranchByCode = (branchCode) => {
  const { branches, loading, error } = useBranches();

  const branch = branches.find((b) => b.branch_code === branchCode) || null;

  return {
    branch,
    loading,
    error,
  };
};

/**
 * Custom hook to get branch details by ID
 * @param {number} branchId - Branch ID to find
 * @returns {Object} { branch, loading, error }
 */
export const useBranchById = (branchId) => {
  const { branches, loading, error } = useBranches();

  const branch = branches.find((b) => b.id === branchId) || null;

  return {
    branch,
    loading,
    error,
  };
};

/**
 * Custom hook to get central branch (SND)
 * @returns {Object} { centralBranch, loading, error }
 */
export const useCentralBranch = () => {
  const { branches, loading, error } = useBranches();

  const centralBranch = branches.find((b) => b.branch_code === "SND") || null;

  return {
    centralBranch,
    loading,
    error,
  };
};
