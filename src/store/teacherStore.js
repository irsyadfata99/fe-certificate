// src/store/teacherStore.js
import { create } from "zustand";

/**
 * Teacher Store
 * Manages teacher data and operations
 */
export const useTeacherStore = create((set, get) => ({
  // State
  teachers: [],
  selectedTeacher: null,
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
    branch: "",
  },
  isLoading: false,
  error: null,

  // Actions
  setTeachers: (teachers, pagination = null) => {
    set({
      teachers,
      pagination: pagination || get().pagination,
      error: null,
    });
  },

  setSelectedTeacher: (teacher) => {
    set({ selectedTeacher: teacher });
  },

  addTeacher: (teacher) => {
    set((state) => ({
      teachers: [teacher, ...state.teachers],
      pagination: {
        ...state.pagination,
        total: state.pagination.total + 1,
      },
    }));
  },

  updateTeacher: (teacherId, updatedData) => {
    set((state) => ({
      teachers: state.teachers.map((teacher) =>
        teacher.id === teacherId ? { ...teacher, ...updatedData } : teacher,
      ),
    }));
  },

  removeTeacher: (teacherId) => {
    set((state) => ({
      teachers: state.teachers.filter((teacher) => teacher.id !== teacherId),
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
        branch: "",
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
      teachers: [],
      selectedTeacher: null,
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
        branch: "",
      },
      isLoading: false,
      error: null,
    });
  },

  // Computed
  getTeacherById: (teacherId) => {
    return get().teachers.find((t) => t.id === teacherId) || null;
  },

  getTeachersByBranch: (branchCode) => {
    return get().teachers.filter((t) =>
      t.branches?.some((b) => b.branch_code === branchCode),
    );
  },

  getTeachersByDivision: (division) => {
    return get().teachers.filter((t) => t.divisions?.includes(division));
  },

  getTotalTeachers: () => {
    return get().pagination.total;
  },
}));
