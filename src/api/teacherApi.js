import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Teacher API Service
 * Handles teacher management (Admin only)
 * Supports multi-branch and multi-division assignments
 * UPDATED: Supports soft delete (resign) functionality
 *
 * IMPORTANT: Backend expects:
 * - branch_ids: array of INTEGER branch IDs (not codes!)
 * - divisions: array of division codes ["JK", "LK"]
 */

/**
 * Get all teachers with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Items per page
 * @param {number} params.offset - Pagination offset
 * @param {string} params.search - Search term (optional)
 * @param {string} params.division - Division filter (optional)
 * @param {string} params.branch - Branch filter (optional)
 * @param {boolean} params.include_inactive - Include resigned teachers (optional, default: false)
 * @returns {Promise} Teachers list with pagination
 */
export const getTeachers = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.TEACHERS, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get teacher by ID
 * @param {number} teacherId
 * @returns {Promise} Teacher data with branches, divisions, is_active, and resigned_at
 */
export const getTeacherById = async (teacherId) => {
  try {
    const response = await axiosInstance.get(
      ENDPOINTS.TEACHER_BY_ID(teacherId),
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Helper: Convert branch codes to branch IDs
 * @param {Array} branchCodes - Array of branch codes ["SND", "MKW"]
 * @param {Array} branchOptions - Branch options from useBranchOptions hook
 * @returns {Array} Array of branch IDs [1, 2]
 */
const convertBranchCodesToIds = (branchCodes, branchOptions) => {
  if (!branchCodes || !Array.isArray(branchCodes)) {
    return [];
  }

  return branchCodes
    .map((code) => {
      const branch = branchOptions.find((opt) => opt.value === code);
      return branch ? branch.id : null;
    })
    .filter((id) => id !== null);
};

/**
 * Create new teacher
 * @param {Object} data - Teacher data
 * @param {string} data.username - Unique username
 * @param {string} data.teacher_name - Full name
 * @param {string[]} data.branchCodes - Array of branch CODES (frontend format)
 * @param {string[]} data.divisions - Array of division codes
 * @param {Array} data.branchOptions - Branch options with IDs (from useBranchOptions)
 * @returns {Promise} Created teacher with generated password
 */
export const createTeacher = async (data) => {
  try {
    // CRITICAL: Convert branch codes to IDs
    const branchIds = convertBranchCodesToIds(
      data.branchCodes,
      data.branchOptions,
    );

    if (branchIds.length === 0) {
      throw new Error("Invalid branch selection - no valid branch IDs found");
    }

    // Backend payload
    const payload = {
      username: data.username,
      teacher_name: data.teacher_name,
      branch_ids: branchIds, // Array of INTEGER IDs [1, 2, 3]
      divisions: data.divisions, // Array of codes ["JK", "LK"]
    };

    console.log("📤 CREATE Teacher Payload:", payload);
    console.log("   Branch Codes →", data.branchCodes);
    console.log("   Branch IDs →", branchIds);

    const response = await axiosInstance.post(ENDPOINTS.TEACHERS, payload);

    if (response.data.success) {
      handleOperationSuccess("create", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Create failed");
  } catch (error) {
    console.error("❌ Create Teacher Error:", error.response?.data || error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update teacher
 * @param {number} teacherId
 * @param {Object} data - Updated teacher data
 * @param {string} data.username - Username
 * @param {string} data.teacher_name - Full name
 * @param {string[]} data.branchCodes - Array of branch CODES (frontend format)
 * @param {string[]} data.divisions - Array of division codes
 * @param {Array} data.branchOptions - Branch options with IDs
 * @param {string} [data.new_password] - Optional new password
 * @returns {Promise} Updated teacher
 */
export const updateTeacher = async (teacherId, data) => {
  try {
    // CRITICAL: Convert branch codes to IDs
    const branchIds = convertBranchCodesToIds(
      data.branchCodes,
      data.branchOptions,
    );

    if (branchIds.length === 0) {
      throw new Error("Invalid branch selection - no valid branch IDs found");
    }

    // Backend payload
    const payload = {
      username: data.username,
      teacher_name: data.teacher_name,
      branch_ids: branchIds, // Array of INTEGER IDs [1, 2, 3]
      divisions: data.divisions, // Array of codes ["JK", "LK"]
    };

    // Only include new_password if provided
    if (data.new_password && data.new_password.trim()) {
      payload.new_password = data.new_password;
    }

    console.log("📤 UPDATE Teacher Payload:", payload);
    console.log("   Branch Codes →", data.branchCodes);
    console.log("   Branch IDs →", branchIds);

    const response = await axiosInstance.put(
      ENDPOINTS.TEACHER_BY_ID(teacherId),
      payload,
    );

    if (response.data.success) {
      handleOperationSuccess("update", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Update failed");
  } catch (error) {
    console.error("❌ Update Teacher Error:", error.response?.data || error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Resign teacher (SOFT DELETE - marks as resigned)
 * UPDATED: Now performs soft delete instead of hard delete
 * @param {number} teacherId
 * @returns {Promise} Resign result with success message
 */
export const deleteTeacher = async (teacherId) => {
  try {
    const response = await axiosInstance.delete(
      ENDPOINTS.TEACHER_BY_ID(teacherId),
    );

    if (response.data.success) {
      // Show custom success message for soft delete
      const message =
        response.data.data?.message ||
        response.data.message ||
        "Teacher resigned successfully";

      handleOperationSuccess("delete", response.data.data);

      return response.data;
    }

    throw new Error(response.data.message || "Resign failed");
  } catch (error) {
    // Handle specific error for already resigned teacher
    const backendMessage = error.response?.data?.message;

    if (backendMessage && backendMessage.includes("already resigned")) {
      handleApiError(error, {
        customMessage: backendMessage,
      });
    } else {
      handleApiError(error);
    }

    throw error;
  }
};
