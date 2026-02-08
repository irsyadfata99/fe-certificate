import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Authentication Store
 * Manages user authentication state, tokens, and user data
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (userData, tokens) => {
        set({
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });

        // Persist tokens in localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      },

      updateUser: (userData) => {
        set({ user: userData });
      },

      updateTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      },

      logout: () => {
        // Clear state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      // Getters
      getUser: () => get().user,
      getAccessToken: () => get().accessToken,
      isAdmin: () => get().user?.role === "admin",
      isTeacher: () => get().user?.role === "teacher",
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
