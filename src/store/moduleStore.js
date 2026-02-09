// src/store/moduleStore.js
import { create } from "zustand";

/**
 * Module Store
 * Manages module data and operations
 */
export const useModuleStore = create((set, get) => ({
  // State
  modules: [],
  selectedModule: null,
  stats: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    currentPage: 1,
    totalPages: 0,
  },
  filters: {
    search: "",
    division: "",
    minAge: null,
    maxAge: null,
  },
  isLoading: false,
  error: null,

  // Actions
  setModules: (modules, pagination = null) => {
    set({
      modules,
      pagination: pagination || get().pagination,
      error: null,
    });
  },

  setSelectedModule: (module) => {
    set({ selectedModule: module });
  },

  setStats: (stats) => {
    set({ stats });
  },

  addModule: (module) => {
    set((state) => ({
      modules: [module, ...state.modules],
      pagination: {
        ...state.pagination,
        total: state.pagination.total + 1,
      },
    }));
  },

  updateModule: (moduleId, updatedData) => {
    set((state) => ({
      modules: state.modules.map((module) =>
        module.id === moduleId ? { ...module, ...updatedData } : module,
      ),
    }));
  },

  removeModule: (moduleId) => {
    set((state) => ({
      modules: state.modules.filter((module) => module.id !== moduleId),
      pagination: {
        ...state.pagination,
        total: Math.max(0, state.pagination.total - 1),
      },
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        search: "",
        division: "",
        minAge: null,
        maxAge: null,
      },
    });
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
      modules: [],
      selectedModule: null,
      stats: null,
      pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        currentPage: 1,
        totalPages: 0,
      },
      filters: {
        search: "",
        division: "",
        minAge: null,
        maxAge: null,
      },
      isLoading: false,
      error: null,
    });
  },

  // Computed
  getModuleById: (moduleId) => {
    return get().modules.find((m) => m.id === moduleId) || null;
  },

  getModulesByDivision: (division) => {
    return get().modules.filter((m) => m.division === division);
  },

  getModulesByAgeRange: (age) => {
    return get().modules.filter((m) => age >= m.min_age && age <= m.max_age);
  },

  getTotalModules: () => {
    return get().pagination.total;
  },

  getModuleOptions: () => {
    return get().modules.map((m) => ({
      value: m.id,
      label: `${m.module_code} - ${m.module_name}`,
      division: m.division,
      ageRange: `${m.min_age}-${m.max_age} years`,
    }));
  },
}));
