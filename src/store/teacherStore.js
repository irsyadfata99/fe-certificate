// src/store/teacherStore.js
import { create } from "zustand";

/**
 * Teacher Store
 * Manages teacher data and operations
 * Supports multi-branch and multi-division teachers
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

  // =====================================================
  // COMPUTED - UPDATED FOR MULTI-BRANCH/DIVISION
  // =====================================================

  /**
   * Get teacher by ID
   */
  getTeacherById: (teacherId) => {
    return get().teachers.find((t) => t.id === teacherId) || null;
  },

  /**
   * Get teachers by branch code (handles array of branches)
   * @param {string} branchCode - Branch code to filter by
   * @returns {Array} Teachers assigned to this branch
   */
  getTeachersByBranch: (branchCode) => {
    return get().teachers.filter((teacher) => {
      // Check if teacher.branches array contains this branch code
      if (Array.isArray(teacher.branches)) {
        return teacher.branches.some((b) => b.branch_code === branchCode);
      }
      // Fallback for legacy single branch format
      return teacher.teacher_branch === branchCode;
    });
  },

  /**
   * Get teachers by division (handles array of divisions)
   * @param {string} division - Division to filter by (JK or LK)
   * @returns {Array} Teachers assigned to this division
   */
  getTeachersByDivision: (division) => {
    return get().teachers.filter((teacher) => {
      // Check if teacher.divisions array contains this division
      if (Array.isArray(teacher.divisions)) {
        return teacher.divisions.includes(division);
      }
      // Fallback for legacy single division format
      return teacher.teacher_division === division;
    });
  },

  /**
   * Get teachers by both branch AND division
   * @param {string} branchCode - Branch code
   * @param {string} division - Division code
   * @returns {Array} Teachers assigned to both
   */
  getTeachersByBranchAndDivision: (branchCode, division) => {
    return get().teachers.filter((teacher) => {
      const hasBranch = Array.isArray(teacher.branches)
        ? teacher.branches.some((b) => b.branch_code === branchCode)
        : teacher.teacher_branch === branchCode;

      const hasDivision = Array.isArray(teacher.divisions)
        ? teacher.divisions.includes(division)
        : teacher.teacher_division === division;

      return hasBranch && hasDivision;
    });
  },

  /**
   * Get total teachers count
   */
  getTotalTeachers: () => {
    return get().pagination.total;
  },

  /**
   * Get teachers with multiple branches
   * @returns {Array} Teachers assigned to more than one branch
   */
  getMultiBranchTeachers: () => {
    return get().teachers.filter(
      (teacher) =>
        Array.isArray(teacher.branches) && teacher.branches.length > 1,
    );
  },

  /**
   * Get teachers with multiple divisions
   * @returns {Array} Teachers assigned to more than one division
   */
  getMultiDivisionTeachers: () => {
    return get().teachers.filter(
      (teacher) =>
        Array.isArray(teacher.divisions) && teacher.divisions.length > 1,
    );
  },

  /**
   * Get unique branch codes from all teachers
   * @returns {Array} Array of unique branch codes
   */
  getAllAssignedBranches: () => {
    const branches = new Set();
    get().teachers.forEach((teacher) => {
      if (Array.isArray(teacher.branches)) {
        teacher.branches.forEach((b) => branches.add(b.branch_code));
      }
    });
    return Array.from(branches);
  },

  /**
   * Get unique divisions from all teachers
   * @returns {Array} Array of unique divisions
   */
  getAllAssignedDivisions: () => {
    const divisions = new Set();
    get().teachers.forEach((teacher) => {
      if (Array.isArray(teacher.divisions)) {
        teacher.divisions.forEach((d) => divisions.add(d));
      }
    });
    return Array.from(divisions);
  },
}));
