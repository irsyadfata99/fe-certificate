// src/store/branchStore.js
import { create } from "zustand";

/**
 * Branch Store
 * Manages branch data (dynamic branches)
 */
export const useBranchStore = create((set, get) => ({
  // State
  branches: [],
  selectedBranch: null,
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  setBranches: (branches) => {
    set({ branches, error: null });
  },

  setSelectedBranch: (branch) => {
    set({ selectedBranch: branch });
  },

  setStats: (stats) => {
    set({ stats });
  },

  addBranch: (branch) => {
    set((state) => ({
      branches: [...state.branches, branch].sort((a, b) =>
        a.branch_code.localeCompare(b.branch_code),
      ),
    }));
  },

  updateBranch: (branchId, updatedData) => {
    set((state) => ({
      branches: state.branches.map((branch) =>
        branch.id === branchId ? { ...branch, ...updatedData } : branch,
      ),
    }));
  },

  removeBranch: (branchId) => {
    set((state) => ({
      branches: state.branches.filter((branch) => branch.id !== branchId),
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
      branches: [],
      selectedBranch: null,
      stats: null,
      isLoading: false,
      error: null,
    });
  },

  // Computed
  getBranchById: (branchId) => {
    return get().branches.find((b) => b.id === branchId) || null;
  },

  getBranchByCode: (branchCode) => {
    return get().branches.find((b) => b.branch_code === branchCode) || null;
  },

  getActiveBranches: () => {
    return get().branches.filter((b) => b.is_active);
  },

  getBranchOptions: () => {
    return get()
      .branches.filter((b) => b.is_active)
      .map((b) => ({
        value: b.branch_code,
        label: b.branch_name,
        id: b.id,
      }));
  },

  getCentralBranch: () => {
    return get().branches.find((b) => b.branch_code === "SND") || null;
  },

  getTotalBranches: () => {
    return get().branches.length;
  },
}));
