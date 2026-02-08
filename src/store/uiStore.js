import { create } from "zustand";

/**
 * UI Store
 * Manages global UI state (loading, modals, notifications)
 */
export const useUIStore = create((set) => ({
  // Loading states
  isGlobalLoading: false,
  loadingMessage: "",

  // Modal state
  activeModal: null,
  modalData: null,

  // Sidebar state
  isSidebarOpen: true,

  // Actions
  setGlobalLoading: (isLoading, message = "") => {
    set({ isGlobalLoading: isLoading, loadingMessage: message });
  },

  openModal: (modalName, data = null) => {
    set({ activeModal: modalName, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ isSidebarOpen: isOpen });
  },
}));
