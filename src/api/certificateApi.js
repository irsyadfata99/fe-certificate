import api from "./axiosConfig";
import { handleApiError } from "@utils/errorHandler";
import { toast } from "react-hot-toast";

// =====================================================
// CERTIFICATE API
// =====================================================

/**
 * Get all certificates with pagination and regional hub filter
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of items per page
 * @param {number} params.offset - Offset for pagination
 * @param {string} params.search - Search term (optional)
 * @param {string} params.regional_hub - Regional hub code for filtering (optional)
 * @returns {Promise} API response
 */
export const getCertificates = async (params = {}) => {
  try {
    const { limit = 10, offset = 0, search = "", regional_hub = "" } = params;

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (search && search.trim()) {
      queryParams.append("search", search.trim());
    }

    // NEW: Add regional_hub filter
    if (regional_hub && regional_hub.trim()) {
      queryParams.append("regional_hub", regional_hub.trim());
    }

    const response = await api.get(`/certificates?${queryParams.toString()}`);

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Get single certificate by ID
 * @param {string} certificateId - Certificate batch ID
 * @returns {Promise} API response
 */
export const getCertificateById = async (certificateId) => {
  try {
    const response = await api.get(`/certificates/${certificateId}`);

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Create new certificate batch
 * @param {Object} data - Certificate data
 * @param {string} data.certificate_id - Batch ID
 * @param {number} data.jumlah_sertifikat - Number of certificates
 * @param {number} data.jumlah_medali - Number of medals
 * @param {string} data.branch_code - Head branch code (for admin)
 * @returns {Promise} API response
 */
export const createCertificate = async (data) => {
  try {
    const response = await api.post("/certificates", {
      certificate_id: data.certificate_id,
      jumlah_sertifikat: parseInt(data.jumlah_sertifikat) || 0,
      jumlah_medali: parseInt(data.jumlah_medali) || 0,
      branch_code: data.branch_code, // Send selected head branch
    });

    toast.success(response.data?.message || "Certificate batch created successfully");

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Migrate certificate stock from head branch to another branch in same regional hub
 * @param {Object} data - Migration data
 * @param {string} data.certificate_id - Batch ID to migrate
 * @param {string} data.destination_branch - Branch code to migrate to (e.g., 'MKW', 'KBP')
 * @param {number} data.certificate_amount - Number of certificates to migrate
 * @param {number} data.medal_amount - Number of medals to migrate
 * @returns {Promise} API response
 */
export const migrateCertificate = async (data) => {
  try {
    const response = await api.post("/certificates/migrate", {
      certificate_id: data.certificate_id,
      destination_branch: data.destination_branch,
      certificate_amount: parseInt(data.certificate_amount) || 0,
      medal_amount: parseInt(data.medal_amount) || 0,
    });

    toast.success(response.data?.message || "Stock migrated successfully");

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Get stock summary across all branches
 * @returns {Promise} API response with stock summary
 */
export const getStockSummary = async () => {
  try {
    const response = await api.get("/certificates/summary");

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Get transaction history with filters
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of items per page
 * @param {number} params.offset - Offset for pagination
 * @param {string} params.from_date - Start date (YYYY-MM-DD)
 * @param {string} params.to_date - End date (YYYY-MM-DD)
 * @returns {Promise} API response
 */
export const getTransactionHistory = async (params = {}) => {
  try {
    const { limit = 50, offset = 0, from_date = "", to_date = "" } = params;

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (from_date && from_date.trim()) {
      queryParams.append("from_date", from_date.trim());
    }

    if (to_date && to_date.trim()) {
      queryParams.append("to_date", to_date.trim());
    }

    const response = await api.get(`/certificates/history?${queryParams.toString()}`);

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

/**
 * Clear all certificate batches (DANGER)
 * @returns {Promise} API response
 */
export const clearAllCertificates = async () => {
  try {
    const response = await api.post("/certificates/clear-all");

    toast.success(response.data?.message || "All certificates cleared successfully");

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: true });
    throw error;
  }
};

export default {
  getCertificates,
  getCertificateById,
  createCertificate,
  migrateCertificate,
  getStockSummary,
  getTransactionHistory,
  clearAllCertificates,
};
