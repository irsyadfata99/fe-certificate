import { useState, useEffect, useCallback } from "react";
import { getActiveBranches, getHeadBranches } from "@api/branchApi";

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
 * Custom hook for fetching head branches only
 * @returns {Object} { headBranches, loading, error, refetch }
 */
export const useHeadBranches = () => {
  const [headBranches, setHeadBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHeadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getHeadBranches();

      if (response.success) {
        const branchData = response.data || [];
        setHeadBranches(branchData);
      } else {
        throw new Error(response.message || "Failed to fetch head branches");
      }
    } catch (err) {
      console.error("Failed to fetch head branches:", err);
      setError(err.message || "Failed to load head branches");
      setHeadBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeadBranches();
  }, [fetchHeadBranches]);

  return {
    headBranches,
    loading,
    error,
    refetch: fetchHeadBranches,
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
    isHeadBranch: branch.is_head_branch,
    regionalHub: branch.regional_hub,
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
 * Custom hook for head branch options (for select/dropdown)
 * @returns {Object} { headBranchOptions, loading, error }
 */
export const useHeadBranchOptions = () => {
  const { headBranches, loading, error, refetch } = useHeadBranches();

  const headBranchOptions = headBranches.map((branch) => ({
    value: branch.branch_code,
    label: `${branch.branch_name} (${branch.branch_code})`,
    id: branch.id,
    isActive: branch.is_active,
  }));

  return {
    headBranchOptions,
    headBranches,
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
 * Custom hook to get central branch (SND) or first head branch
 * @returns {Object} { centralBranch, loading, error }
 */
export const useCentralBranch = () => {
  const { branches, loading, error } = useBranches();

  // Try to find SND first, otherwise get the first head branch
  const centralBranch =
    branches.find((b) => b.branch_code === "SND") ||
    branches.find((b) => b.is_head_branch) ||
    null;

  return {
    centralBranch,
    loading,
    error,
  };
};

/**
 * Custom hook to filter branches by regional hub
 * @param {string} regionalHub - Regional hub code
 * @returns {Object} { branches, loading, error }
 */
export const useBranchesByHub = (regionalHub) => {
  const { branches, loading, error } = useBranches();

  const filteredBranches = regionalHub
    ? branches.filter((b) => b.regional_hub === regionalHub)
    : branches;

  return {
    branches: filteredBranches,
    loading,
    error,
  };
};
