import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Teacher API Service
 * Handles teacher management (Admin only)
 * Supports multi-branch and multi-division assignments
 */

/**
 * Get all teachers with pagination
 * @param {Object} params - { limit, offset }
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
 * @returns {Promise} Teacher data with branches and divisions arrays
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
 * Create new teacher
 * @param {Object} data - Teacher data
 * @param {string} data.username - Unique username
 * @param {string} data.teacher_name - Full name
 * @param {string[]} data.branches - Array of branch codes (e.g., ["SND", "MKW"])
 * @param {string[]} data.divisions - Array of divisions (e.g., ["JK", "LK"])
 * @returns {Promise} Created teacher with generated password
 */
export const createTeacher = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.TEACHERS, data);

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
 * Update teacher
 * @param {number} teacherId
 * @param {Object} data - Updated teacher data
 * @param {string} data.username - Username
 * @param {string} data.teacher_name - Full name
 * @param {string[]} data.branches - Array of branch codes
 * @param {string[]} data.divisions - Array of divisions
 * @param {string} [data.new_password] - Optional new password
 * @returns {Promise} Updated teacher
 */
export const updateTeacher = async (teacherId, data) => {
  try {
    const response = await axiosInstance.put(
      ENDPOINTS.TEACHER_BY_ID(teacherId),
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
 * Delete teacher
 * @param {number} teacherId
 * @returns {Promise} Delete result
 */
export const deleteTeacher = async (teacherId) => {
  try {
    const response = await axiosInstance.delete(
      ENDPOINTS.TEACHER_BY_ID(teacherId),
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
