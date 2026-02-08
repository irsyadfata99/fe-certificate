import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Printed Certificate API Service
 * Handles printed certificate records
 */

/**
 * Get modules for dropdown (teacher use)
 * @returns {Promise} Modules list
 */
export const getModulesForPrint = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.PRINTED_CERT_MODULES);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Save printed certificate record
 * @param {Object} data - { certificate_id, student_name, module_id, ptc_date }
 * @returns {Promise} Saved record
 */
export const savePrintRecord = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.PRINTED_CERTS, data);

    if (response.data.success) {
      handleOperationSuccess("save", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Save failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get print history with filters
 * @param {Object} params - { page, limit, search, module_id, start_date, end_date }
 * @returns {Promise} Print history with pagination
 */
export const getPrintHistory = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.PRINTED_CERT_HISTORY, {
      params,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single print record by ID
 * @param {number} recordId
 * @returns {Promise} Print record data
 */
export const getPrintRecordById = async (recordId) => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.PRINTED_CERTS}/${recordId}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
