/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Light Mode Colors
        light: {
          background: "#FFFFFF",
          surface: "#F8FAFC",
          primary: "#6495ED",
          secondary: "#FF00FF",
          "text-primary": "#1E293B",
          "text-secondary": "#64748B",
        },
        // Dark Mode Colors
        dark: {
          background: "#0F172A",
          surface: "#1E293B",
          primary: "#6495ED",
          secondary: "#FF00FF",
          "text-primary": "#F1F5F9",
          "text-secondary": "#94A3B8",
        },
        // Status Colors
        status: {
          success: "#22C55E",
          warning: "#EAB308",
          error: "#EF4444",
        },
      },
      backgroundColor: {
        // Light mode backgrounds
        base: "var(--color-background)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
      textColor: {
        // Text colors
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
      },
      borderColor: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
    },
  },
  plugins: [],
};
