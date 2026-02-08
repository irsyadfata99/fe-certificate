import axiosInstance from "./axiosConfig";
import { ENDPOINTS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";
import { handleSuccess } from "../utils/successHandler";

/**
 * Auth API Service
 * Handles authentication operations
 */

/**
 * Login user
 * @param {Object} credentials - { username, password }
 * @returns {Promise} User data and tokens
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.LOGIN, credentials);

    if (response.data.success) {
      handleSuccess("Login successful");
      return response.data;
    }

    throw new Error(response.data.message || "Login failed");
  } catch (error) {
    handleApiError(error, {
      customMessage: "Login failed. Please check your credentials.",
    });
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken
 * @returns {Promise} New tokens
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.REFRESH_TOKEN, {
      refreshToken,
    });

    return response.data;
  } catch (error) {
    handleApiError(error, { showToast: false });
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.PROFILE);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Update username
 * @param {Object} data - { new_username, current_password }
 * @returns {Promise} Updated user data
 */
export const updateUsername = async (data) => {
  try {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_USERNAME, data);

    if (response.data.success) {
      handleSuccess("Username updated successfully");
      return response.data;
    }

    throw new Error(response.data.message || "Update failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Update password
 * @param {Object} data - { current_password, new_password, confirm_password }
 * @returns {Promise} Success response
 */
export const updatePassword = async (data) => {
  try {
    const response = await axiosInstance.put(ENDPOINTS.UPDATE_PASSWORD, data);

    if (response.data.success) {
      handleSuccess("Password updated successfully");
      return response.data;
    }

    throw new Error(response.data.message || "Update failed");
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
