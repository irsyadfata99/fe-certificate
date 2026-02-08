import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Export API Service
 * Handles data export to Excel
 */

/**
 * Helper function to download file
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
 * Export all data (multi-sheet)
 * @returns {Promise} Excel file download
 */
export const exportAllData = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_ALL, {
      responseType: "blob",
    });

    const filename = `all_data_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export certificates
 * @returns {Promise} Excel file download
 */
export const exportCertificates = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_CERTIFICATES, {
      responseType: "blob",
    });

    const filename = `certificates_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export logs
 * @returns {Promise} Excel file download
 */
export const exportLogs = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_LOGS, {
      responseType: "blob",
    });

    const filename = `logs_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export teachers
 * @returns {Promise} Excel file download
 */
export const exportTeachers = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_TEACHERS, {
      responseType: "blob",
    });

    const filename = `teachers_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export modules
 * @returns {Promise} Excel file download
 */
export const exportModules = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_MODULES, {
      responseType: "blob",
    });

    const filename = `modules_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Export printed certificates
 * @returns {Promise} Excel file download
 */
export const exportPrintedCertificates = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.EXPORT_PRINTED, {
      responseType: "blob",
    });

    const filename = `printed_certificates_${new Date().toISOString().split("T")[0]}.xlsx`;
    downloadFile(response.data, filename);

    handleOperationSuccess("export");
    return { success: true };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
