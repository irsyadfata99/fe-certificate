import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";

/**
 * Logs API Service
 * Handles certificate logs and audit trail
 */

/**
 * Get all logs with filters
 * @param {Object} params - { limit, offset, certificate_id, action_type, from_date, to_date, search, regional_hub }
 * @returns {Promise} Logs list with pagination
 */
export const getLogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.LOGS, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get logs by certificate ID
 * @param {string} certificateId
 * @returns {Promise} Logs for specific certificate
 */
export const getLogsByCertificate = async (certificateId) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.LOGS_BY_CERT(certificateId));
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export default {
  getLogs,
  getLogsByCertificate,
};
