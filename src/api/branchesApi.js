import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";

/**
 * Branches API Service
 * Handles branch information retrieval
 */

/**
 * Get all branches
 * @returns {Promise} Branches list
 */
export const getBranches = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.BRANCHES);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get branch statistics (stock, teachers, students count)
 * @returns {Promise} Branch statistics
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
