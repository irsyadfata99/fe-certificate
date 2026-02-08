import { create } from "zustand";

/**
 * Certificate Store
 * Manages certificate data and operations
 */
export const useCertificateStore = create((set, get) => ({
  // State
  certificates: [],
  selectedCertificate: null,
  summary: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    currentPage: 1,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  // Actions
  setCertificates: (certificates, pagination = null) => {
    set({
      certificates,
      pagination: pagination || get().pagination,
      error: null,
    });
  },

  setSelectedCertificate: (certificate) => {
    set({ selectedCertificate: certificate });
  },

  setSummary: (summary) => {
    set({ summary });
  },

  addCertificate: (certificate) => {
    set((state) => ({
      certificates: [certificate, ...state.certificates],
    }));
  },

  updateCertificate: (certificateId, updatedData) => {
    set((state) => ({
      certificates: state.certificates.map((cert) =>
        cert.certificate_id === certificateId
          ? { ...cert, ...updatedData }
          : cert,
      ),
    }));
  },

  removeCertificate: (certificateId) => {
    set((state) => ({
      certificates: state.certificates.filter(
        (cert) => cert.certificate_id !== certificateId,
      ),
    }));
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      certificates: [],
      selectedCertificate: null,
      summary: null,
      pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        currentPage: 1,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    });
  },
}));
