import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Certificate API Service
 * Handles certificate CRUD and operations
 */

/**
 * Get all certificates with pagination
 * @param {Object} params - { limit, offset }
 * @returns {Promise} Certificates list with pagination
 */
export const getCertificates = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.CERTIFICATES, {
      params,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get certificate by ID
 * @param {string} certificateId
 * @returns {Promise} Certificate data
 */
export const getCertificateById = async (certificateId) => {
  try {
    const response = await axiosInstance.get(
      ENDPOINTS.CERTIFICATE_BY_ID(certificateId),
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create new certificate batch
 * @param {Object} data - Certificate batch data
 * @returns {Promise} Created certificate
 */
export const createCertificate = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.CERTIFICATES, data);

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
 * Get stock summary
 * @returns {Promise} Stock summary data
 */
export const getStockSummary = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.CERTIFICATE_SUMMARY);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get transaction history
 * @param {Object} params - { limit, offset, from_date, to_date }
 * @returns {Promise} Transaction history
 */
export const getTransactionHistory = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.CERTIFICATE_HISTORY, {
      params,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Migrate certificate stock
 * @param {Object} data - Migration data
 * @returns {Promise} Migration result
 */
export const migrateCertificate = async (data) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.CERTIFICATE_MIGRATE,
      data,
    );

    if (response.data.success) {
      handleOperationSuccess("migrate", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Migration failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Clear all certificates
 * @returns {Promise} Clear result
 */
export const clearAllCertificates = async () => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.CERTIFICATE_CLEAR);

    if (response.data.success) {
      handleOperationSuccess("delete", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Clear failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
