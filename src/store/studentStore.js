// src/store/studentStore.js
import { create } from "zustand";

/**
 * Student Store
 * Manages student data and operations
 */
export const useStudentStore = create((set, get) => ({
  // State
  students: [],
  selectedStudent: null,
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
    branchId: null,
    division: "",
    status: "active",
  },
  isLoading: false,
  error: null,

  // Actions
  setStudents: (students, pagination = null) => {
    set({
      students,
      pagination: pagination || get().pagination,
      error: null,
    });
  },

  setSelectedStudent: (student) => {
    set({ selectedStudent: student });
  },

  setStats: (stats) => {
    set({ stats });
  },

  addStudent: (student) => {
    set((state) => ({
      students: [student, ...state.students],
      pagination: {
        ...state.pagination,
        total: state.pagination.total + 1,
      },
    }));
  },

  updateStudent: (studentId, updatedData) => {
    set((state) => ({
      students: state.students.map((student) =>
        student.id === studentId ? { ...student, ...updatedData } : student,
      ),
    }));
  },

  removeStudent: (studentId) => {
    set((state) => ({
      students: state.students.filter((student) => student.id !== studentId),
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
        branchId: null,
        division: "",
        status: "active",
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
      students: [],
      selectedStudent: null,
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
        branchId: null,
        division: "",
        status: "active",
      },
      isLoading: false,
      error: null,
    });
  },

  // Computed
  getStudentById: (studentId) => {
    return get().students.find((s) => s.id === studentId) || null;
  },

  getStudentsByBranch: (branchId) => {
    return get().students.filter((s) => s.branch_id === branchId);
  },

  getStudentsByDivision: (division) => {
    return get().students.filter((s) => s.division === division);
  },

  getActiveStudents: () => {
    return get().students.filter((s) => s.status === "active");
  },

  getTotalStudents: () => {
    return get().pagination.total;
  },

  getStudentOptions: () => {
    return get().students.map((s) => ({
      value: s.id,
      label: s.student_name,
      branchCode: s.branch_code,
      division: s.division,
      status: s.status,
    }));
  },
}));
