import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";

/**
 * Export API Service
 * Handles data export to Excel files
 */

/**
 * Helper function to download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename to save as
 */
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export certificates to Excel
 * @returns {Promise} Excel file download
 */
export const exportCertificates = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_CERTIFICATES, {
      responseType: "blob",
    });

    const filename = `certificates_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export certificate logs to Excel (with optional regional hub filter)
 * @param {Object} params - { regional_hub }
 * @returns {Promise} Excel file download
 */
export const exportLogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_LOGS, {
      params, // Pass regional_hub parameter
      responseType: "blob",
    });

    // Generate filename based on filter
    const filename = params.regional_hub ? `certificate_logs_${params.regional_hub}_${new Date().toISOString().split("T")[0]}.xlsx` : `certificate_logs_${new Date().toISOString().split("T")[0]}.xlsx`;

    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export teachers to Excel
 * @returns {Promise} Excel file download
 */
export const exportTeachers = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_TEACHERS, {
      responseType: "blob",
    });

    const filename = `teachers_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export modules to Excel
 * @returns {Promise} Excel file download
 */
export const exportModules = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_MODULES, {
      responseType: "blob",
    });

    const filename = `modules_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export printed certificates to Excel
 * @returns {Promise} Excel file download
 */
export const exportPrintedCertificates = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_PRINTED_CERTIFICATES, {
      responseType: "blob",
    });

    const filename = `printed_certificates_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export students to Excel (optionally filtered by branch)
 * @param {Object} params - { branch_code }
 * @returns {Promise} Excel file download
 */
export const exportStudents = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_STUDENTS, {
      params,
      responseType: "blob",
    });

    const filename = params.branch_code ? `students_${params.branch_code}_${new Date().toISOString().split("T")[0]}.xlsx` : `students_all_${new Date().toISOString().split("T")[0]}.xlsx`;

    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export students by specific branch
 * @param {string} branchCode - Branch code
 * @returns {Promise} Excel file download
 */
export const exportStudentsByBranch = async (branchCode) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_STUDENTS_BY_BRANCH(branchCode), {
      responseType: "blob",
    });

    const filename = `students_${branchCode}_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export student transfer history to Excel
 * @returns {Promise} Excel file download
 */
export const exportStudentTransfers = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_STUDENT_TRANSFERS, {
      responseType: "blob",
    });

    const filename = `student_transfers_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export all data (multi-sheet)
 * @returns {Promise} Excel file download
 */
export const exportAllData = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_ALL, {
      responseType: "blob",
    });

    const filename = `certificate_system_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export default {
  exportCertificates,
  exportLogs,
  exportTeachers,
  exportModules,
  exportPrintedCertificates,
  exportStudents,
  exportStudentsByBranch,
  exportStudentTransfers,
  exportAllData,
};
