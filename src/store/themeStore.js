import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme Store
 * Manages dark/light mode
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      isDarkMode: false,

      // Actions
      toggleTheme: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });

        // Update HTML class
        if (newMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });

        // Update HTML class
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      initTheme: () => {
        const isDark = get().isDarkMode;

        // Apply theme on init
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    },
  ),
);
