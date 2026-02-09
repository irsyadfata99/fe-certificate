import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleOperationSuccess } from "../utils/successHandler";

/**
 * Students API Service
 * Handles student management operations
 */

/**
 * Get all students with filters
 * @param {Object} params - { limit, offset, search, branch, division, status }
 * @returns {Promise} Students list with pagination
 */
export const getStudents = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.STUDENTS, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get student by ID
 * @param {number} studentId
 * @returns {Promise} Student data
 */
export const getStudentById = async (studentId) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.STUDENT_BY_ID(studentId));
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Search students (for autocomplete)
 * @param {string} query - Search query
 * @param {Object} params - Additional params like branch, division
 * @returns {Promise} Students list
 */
export const searchStudents = async (query, params = {}) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.STUDENTS_SEARCH, {
      params: { query, ...params },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get student statistics
 * @returns {Promise} Student statistics
 */
export const getStudentStats = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.STUDENTS_STATS);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create new student
 * @param {Object} data - Student data
 * @returns {Promise} Created student
 */
export const createStudent = async (data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.STUDENTS, data);

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
 * Update student
 * @param {number} studentId
 * @param {Object} data - Updated student data
 * @returns {Promise} Updated student
 */
export const updateStudent = async (studentId, data) => {
  try {
    const response = await axiosInstance.put(ENDPOINTS.STUDENT_BY_ID(studentId), data);

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
 * Delete student
 * @param {number} studentId
 * @returns {Promise} Delete result
 */
export const deleteStudent = async (studentId) => {
  try {
    const response = await axiosInstance.delete(ENDPOINTS.STUDENT_BY_ID(studentId));

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

/**
 * Transfer student to another branch
 * @param {number} studentId
 * @param {Object} data - { new_branch, transfer_reason }
 * @returns {Promise} Transfer result
 */
export const transferStudent = async (studentId, data) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.STUDENT_TRANSFER(studentId), data);

    if (response.data.success) {
      handleOperationSuccess("update", response.data.data);
      return response.data;
    }

    throw new Error(response.data.message || "Transfer failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get student's completed modules
 * @param {number} studentId
 * @returns {Promise} Student modules list
 */
export const getStudentModules = async (studentId) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.STUDENT_MODULES(studentId));
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
