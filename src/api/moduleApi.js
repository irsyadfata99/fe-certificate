import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Module API Service
 * Handles module management (Admin only)
 */

/**
 * Get all modules with filters
 * @param {Object} params - { limit, offset, search, division, min_age, max_age }
 * @returns {Promise} Modules list with pagination
 */
export const getModules = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.MODULES, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get module by ID
 * @param {number} moduleId
 * @returns {Promise} Module data
 */
export const getModuleById = async (moduleId) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.MODULE_BY_ID(moduleId));
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get module statistics
 * @returns {Promise} Module stats
 */
export const getModuleStats = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.MODULE_STATS);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create new module
 * @param {Object} data - Module data
 * @returns {Promise} Created module
 */
export const createModule = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.MODULES, data);

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
 * Update module
 * @param {number} moduleId
 * @param {Object} data - Updated module data
 * @returns {Promise} Updated module
 */
export const updateModule = async (moduleId, data) => {
  try {
    const response = await axiosInstance.put(
      ENDPOINTS.MODULE_BY_ID(moduleId),
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
 * Delete module
 * @param {number} moduleId
 * @returns {Promise} Delete result
 */
export const deleteModule = async (moduleId) => {
  try {
    const response = await axiosInstance.delete(
      ENDPOINTS.MODULE_BY_ID(moduleId),
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
