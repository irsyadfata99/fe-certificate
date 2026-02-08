import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: true,
  },

  // Build optimization
  build: {
    // Output directory
    outDir: "dist",
    // Generate sourcemaps for production debugging (set to false for production)
    sourcemap: false,
    // Reduce bundle size
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI libraries
          ui: ["lucide-react", "react-hot-toast"],
          // State management
          store: ["zustand"],
          // Form handling
          forms: ["react-hook-form"],
          // API & utilities
          api: ["axios", "date-fns"],
        },
      },
    },
  },

  // Preview server (for production build preview)
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "axios",
      "react-hot-toast",
      "lucide-react",
      "react-hook-form",
      "date-fns",
    ],
  },
});
