import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Branch API Service
 * Handles branch CRUD operations with regional hub support
 */

/**
 * Get all active branches
 * @param {Object} params - { include_inactive }
 * @returns {Promise} List of branches
 */
export const getActiveBranches = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.BRANCHES, {
      params: {
        include_inactive: false,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get all branches (including inactive)
 * @param {Object} params - Query parameters
 * @returns {Promise} List of all branches
 */
export const getAllBranches = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.BRANCHES, {
      params: {
        include_inactive: true,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get branch by ID
 * @param {number} branchId
 * @returns {Promise} Branch details
 */
export const getBranchById = async (branchId) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.BRANCH_BY_ID(branchId));
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get all head branches (for dropdown)
 * @returns {Promise} List of head branches
 */
export const getHeadBranches = async () => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.BRANCHES}/head-branches`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get branches by regional hub
 * @param {string} hub - Regional hub code
 * @returns {Promise} List of branches in the hub
 */
export const getBranchesByHub = async (hub) => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.BRANCHES}/hub/${hub}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create new branch (Admin only)
 * @param {Object} data - { branch_code, branch_name, is_head_branch, regional_hub }
 * @returns {Promise} Created branch
 */
export const createBranch = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.BRANCHES, data);

    if (response.data.success) {
      handleOperationSuccess("create", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Create failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Update branch name (Admin only)
 * Note: branch_code, is_head_branch, regional_hub are immutable
 * @param {number} branchId
 * @param {Object} data - { branch_name }
 * @returns {Promise} Updated branch
 */
export const updateBranch = async (branchId, data) => {
  try {
    const response = await axiosInstance.put(
      ENDPOINTS.BRANCH_BY_ID(branchId),
      data,
    );

    if (response.data.success) {
      handleOperationSuccess("update", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Update failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Toggle branch status (Admin only)
 * @param {number} branchId
 * @param {boolean} isActive
 * @returns {Promise} Updated branch
 */
export const toggleBranchStatus = async (branchId, isActive) => {
  try {
    const response = await axiosInstance.patch(
      `${ENDPOINTS.BRANCHES}/${branchId}/toggle-status`,
      { is_active: isActive },
    );

    if (response.data.success) {
      handleOperationSuccess(
        isActive ? "activate" : "deactivate",
        response.data.data,
      );
      return response.data;
    }

    throw new Error(response.data.message || "Toggle failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Delete branch (Admin only)
 * Must have no dependencies (students, stock, teachers)
 * Additional: Cannot delete head branch if it has dependent branches
 * @param {number} branchId
 * @returns {Promise} Delete result
 */
export const deleteBranch = async (branchId) => {
  try {
    const response = await axiosInstance.delete(
      ENDPOINTS.BRANCH_BY_ID(branchId),
    );

    if (response.data.success) {
      handleOperationSuccess("delete", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Delete failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get branch statistics
 * Now includes regional hub breakdown
 * @returns {Promise} Branch stats (students, teachers, stock, regional_hubs)
 */
export const getBranchStats = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.BRANCHES_STATS);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
