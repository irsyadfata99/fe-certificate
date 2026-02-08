import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import {
  loginUser,
  getUserProfile,
  updateUsername,
  updatePassword,
} from "@api/authApi";
import { USER_ROLES, ROUTES } from "@utils/constants";
import { cancelAllRequests } from "@api/axiosConfig";
import { ENV } from "@config/env";

/**
 * useAuth Hook
 * Centralized authentication management
 *
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const navigate = useNavigate();

  // Get auth store state and actions
  const {
    user,
    isAuthenticated,
    isLoading,
    setAuth,
    updateUser,
    logout: storeLogout,
    setLoading,
    isAdmin,
    isTeacher,
  } = useAuthStore();

  // =====================================================
  // LOGIN
  // =====================================================

  /**
   * Login user with credentials
   * @param {Object} credentials - { username, password }
   * @returns {Promise<Object>} User data and tokens
   */
  const login = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        const response = await loginUser(credentials);

        if (response.success) {
          const { user: userData, accessToken, refreshToken } = response.data;

          // Set auth state
          setAuth(userData, { accessToken, refreshToken });

          // Navigate based on role
          const redirectPath =
            userData.role === USER_ROLES.ADMIN
              ? ROUTES.ADMIN_DASHBOARD
              : ROUTES.TEACHER_DASHBOARD;

          navigate(redirectPath, { replace: true });

          ENV.ENABLE_LOGGING &&
            console.log("✅ Login successful:", userData.username);

          return response;
        }

        throw new Error("Login failed");
      } catch (error) {
        ENV.ENABLE_LOGGING && console.error("❌ Login error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, setAuth, setLoading],
  );

  // =====================================================
  // LOGOUT
  // =====================================================

  /**
   * Logout user and clear session
   */
  const logout = useCallback(() => {
    ENV.ENABLE_LOGGING && console.log("🚪 Logging out user:", user?.username);

    // Cancel all pending requests
    cancelAllRequests("User logged out");

    // Clear auth state
    storeLogout();

    // Navigate to login
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate, storeLogout, user?.username]);

  // =====================================================
  // REFRESH USER PROFILE
  // =====================================================

  /**
   * Fetch and update current user profile
   * @returns {Promise<Object>} Updated user data
   */
  const refreshProfile = useCallback(async () => {
    try {
      const response = await getUserProfile();

      if (response.success) {
        updateUser(response.user);
        return response.user;
      }

      throw new Error("Failed to fetch profile");
    } catch (error) {
      ENV.ENABLE_LOGGING && console.error("❌ Refresh profile error:", error);
      throw error;
    }
  }, [updateUser]);

  // =====================================================
  // UPDATE USERNAME
  // =====================================================

  /**
   * Update current user's username
   * @param {Object} data - { new_username, current_password }
   * @returns {Promise<Object>} Updated user data
   */
  const changeUsername = useCallback(
    async (data) => {
      try {
        const response = await updateUsername(data);

        if (response.success) {
          // Update user in store
          updateUser(response.data);
          return response.data;
        }

        throw new Error("Failed to update username");
      } catch (error) {
        ENV.ENABLE_LOGGING && console.error("❌ Update username error:", error);
        throw error;
      }
    },
    [updateUser],
  );

  // =====================================================
  // UPDATE PASSWORD
  // =====================================================

  /**
   * Update current user's password
   * @param {Object} data - { current_password, new_password, confirm_password }
   * @returns {Promise<Object>} Success response
   */
  const changePassword = useCallback(async (data) => {
    try {
      const response = await updatePassword(data);

      if (response.success) {
        return response;
      }

      throw new Error("Failed to update password");
    } catch (error) {
      ENV.ENABLE_LOGGING && console.error("❌ Update password error:", error);
      throw error;
    }
  }, []);

  // =====================================================
  // ROLE CHECKERS
  // =====================================================

  /**
   * Check if current user has specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = useCallback(
    (role) => {
      return user?.role === role;
    },
    [user?.role],
  );

  /**
   * Check if current user has any of the specified roles
   * @param {Array<string>} roles - Roles to check
   * @returns {boolean}
   */
  const hasAnyRole = useCallback(
    (roles) => {
      return roles.includes(user?.role);
    },
    [user?.role],
  );

  // =====================================================
  // PERMISSION CHECKERS
  // =====================================================

  /**
   * Check if user can access admin features
   * @returns {boolean}
   */
  const canAccessAdmin = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  /**
   * Check if user can access teacher features
   * @returns {boolean}
   */
  const canAccessTeacher = useCallback(() => {
    return isTeacher();
  }, [isTeacher]);

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  /**
   * Check if session is valid
   * @returns {boolean}
   */
  const isSessionValid = useCallback(() => {
    return isAuthenticated && user !== null;
  }, [isAuthenticated, user]);

  /**
   * Get user's display name
   * @returns {string}
   */
  const getUserDisplayName = useCallback(() => {
    if (!user) return "";
    return user.teacherName || user.username || "User";
  }, [user]);

  /**
   * Get user's role label
   * @returns {string}
   */
  const getUserRoleLabel = useCallback(() => {
    if (!user) return "";
    return user.role === USER_ROLES.ADMIN ? "Administrator" : "Teacher";
  }, [user]);

  /**
   * Get user's branch (for teachers)
   * @returns {string|null}
   */
  const getUserBranch = useCallback(() => {
    return user?.teacherBranch || null;
  }, [user]);

  /**
   * Get user's division (for teachers)
   * @returns {string|null}
   */
  const getUserDivision = useCallback(() => {
    return user?.teacherDivision || null;
  }, [user]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    user,
    isAuthenticated,
    isLoading,

    // Auth actions
    login,
    logout,
    refreshProfile,
    changeUsername,
    changePassword,

    // Role checkers
    hasRole,
    hasAnyRole,
    isAdmin: canAccessAdmin,
    isTeacher: canAccessTeacher,

    // Session management
    isSessionValid,

    // User info getters
    getUserDisplayName,
    getUserRoleLabel,
    getUserBranch,
    getUserDivision,
  };
};

export default useAuth;
