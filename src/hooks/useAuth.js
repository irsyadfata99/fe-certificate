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

  const login = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        const response = await loginUser(credentials);

        if (response.success) {
          const { user: userData, accessToken, refreshToken } = response.data;

          setAuth(userData, { accessToken, refreshToken });

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

  const logout = useCallback(() => {
    ENV.ENABLE_LOGGING && console.log("🚪 Logging out user:", user?.username);

    cancelAllRequests("User logged out");
    storeLogout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate, storeLogout, user?.username]);

  // =====================================================
  // REFRESH USER PROFILE
  // =====================================================

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

  const changeUsername = useCallback(
    async (data) => {
      try {
        const response = await updateUsername(data);

        if (response.success) {
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

  const hasRole = useCallback((role) => user?.role === role, [user?.role]);

  const hasAnyRole = useCallback(
    (roles) => roles.includes(user?.role),
    [user?.role],
  );

  // =====================================================
  // PERMISSION CHECKERS
  // =====================================================

  const canAccessAdmin = useCallback(() => isAdmin(), [isAdmin]);
  const canAccessTeacher = useCallback(() => isTeacher(), [isTeacher]);

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  const isSessionValid = useCallback(
    () => isAuthenticated && user !== null,
    [isAuthenticated, user],
  );

  /**
   * Get user's display name
   */
  const getUserDisplayName = useCallback(() => {
    if (!user) return "";
    return user.teacherName || user.username || "User";
  }, [user]);

  /**
   * Get user's role label
   */
  const getUserRoleLabel = useCallback(() => {
    if (!user) return "";
    return user.role === USER_ROLES.ADMIN ? "Administrator" : "Teacher";
  }, [user]);

  // =====================================================
  // BRANCH GETTERS
  // =====================================================

  /**
   * Get user's primary branch code (legacy single value)
   * @returns {string|null}
   */
  const getUserBranch = useCallback(() => {
    return user?.teacherBranch || null;
  }, [user]);

  /**
   * Get user's all branches as array of objects [{branch_id, branch_code, branch_name}]
   * Falls back to single branch if array not available
   * @returns {Array}
   */
  const getUserBranches = useCallback(() => {
    if (
      user?.branches &&
      Array.isArray(user.branches) &&
      user.branches.length > 0
    ) {
      return user.branches;
    }
    // Fallback: wrap legacy single branch into array format
    if (user?.teacherBranch) {
      return [
        { branch_code: user.teacherBranch, branch_name: user.teacherBranch },
      ];
    }
    return [];
  }, [user]);

  /**
   * Get user's branch names as comma-separated string (for display)
   * Uses branch_name from backend if available
   * @returns {string}
   */
  const getUserBranchesDisplay = useCallback(() => {
    const branches = getUserBranches();
    if (branches.length === 0) return "N/A";
    return branches.map((b) => b.branch_name || b.branch_code).join(", ");
  }, [getUserBranches]);

  // =====================================================
  // DIVISION GETTERS
  // =====================================================

  /**
   * Get user's primary division (legacy single value)
   * @returns {string|null}
   */
  const getUserDivision = useCallback(() => {
    return user?.teacherDivision || null;
  }, [user]);

  /**
   * Get user's all divisions as array of strings ["JK", "LK"]
   * Falls back to single division if array not available
   * @returns {Array}
   */
  const getUserDivisions = useCallback(() => {
    if (
      user?.divisions &&
      Array.isArray(user.divisions) &&
      user.divisions.length > 0
    ) {
      return user.divisions;
    }
    // Fallback: wrap legacy single division into array
    if (user?.teacherDivision) {
      return [user.teacherDivision];
    }
    return [];
  }, [user]);

  /**
   * Get user's division names as comma-separated string (for display)
   * @returns {string}
   */
  const getUserDivisionsDisplay = useCallback(() => {
    const divisionNames = { JK: "Junior Koders", LK: "Little Koders" };
    const divisions = getUserDivisions();
    if (divisions.length === 0) return "N/A";
    return divisions.map((d) => divisionNames[d] || d).join(", ");
  }, [getUserDivisions]);

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

    // Branch getters
    getUserBranch, // legacy: single branch code "SND"
    getUserBranches, // array: [{branch_id, branch_code, branch_name}]
    getUserBranchesDisplay, // display string: "Sunda, Mekarwangi"

    // Division getters
    getUserDivision, // legacy: single division code "JK"
    getUserDivisions, // array: ["JK", "LK"]
    getUserDivisionsDisplay, // display string: "Junior Koders, Little Koders"
  };
};

export default useAuth;
