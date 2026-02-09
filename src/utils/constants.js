import { ENV } from "@config/env";

// =====================================================
// API CONFIGURATION
// =====================================================

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  TIMEOUT: ENV.API_TIMEOUT,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// =====================================================
// STORAGE KEYS
// =====================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  THEME: "theme-storage",
  SIDEBAR_STATE: "sidebar_state",
  TABLE_PREFERENCES: "table_preferences",
};

// =====================================================
// USER ROLES
// =====================================================

export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Administrator",
  [USER_ROLES.TEACHER]: "Teacher",
};

// =====================================================
// BRANCHES
// =====================================================

export const BRANCHES = {
  SND: "SND",
  MKW: "MKW",
  KBP: "KBP",
};

export const BRANCH_LABELS = {
  [BRANCHES.SND]: "Sudirman",
  [BRANCHES.MKW]: "Makwana",
  [BRANCHES.KBP]: "Kopo Permai",
};

export const BRANCH_OPTIONS = Object.entries(BRANCH_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// =====================================================
// DIVISIONS
// =====================================================

export const DIVISIONS = {
  JK: "JK",
  LK: "LK",
};

export const DIVISION_LABELS = {
  [DIVISIONS.JK]: "Junior Kids",
  [DIVISIONS.LK]: "Lanjutan Kids",
};

export const DIVISION_OPTIONS = Object.entries(DIVISION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// =====================================================
// PAGINATION
// =====================================================

export const PAGINATION = {
  DEFAULT_LIMIT: ENV.DEFAULT_PAGE_SIZE,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: ENV.MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// =====================================================
// ACTION TYPES FOR LOGS
// =====================================================

export const LOG_ACTION_TYPES = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  DELETE_ALL: "DELETE_ALL",
  MIGRATE: "MIGRATE",
  MODULE_CREATED: "MODULE_CREATED",
  MODULE_UPDATED: "MODULE_UPDATED",
  MODULE_DELETED: "MODULE_DELETED",
};

export const LOG_ACTION_LABELS = {
  [LOG_ACTION_TYPES.CREATE]: "Created",
  [LOG_ACTION_TYPES.UPDATE]: "Updated",
  [LOG_ACTION_TYPES.DELETE]: "Deleted",
  [LOG_ACTION_TYPES.DELETE_ALL]: "Bulk Delete",
  [LOG_ACTION_TYPES.MIGRATE]: "Migrated",
  [LOG_ACTION_TYPES.MODULE_CREATED]: "Module Created",
  [LOG_ACTION_TYPES.MODULE_UPDATED]: "Module Updated",
  [LOG_ACTION_TYPES.MODULE_DELETED]: "Module Deleted",
};

// =====================================================
// API ENDPOINTS
// =====================================================

export const ENDPOINTS = {
  // ========== AUTH ==========
  LOGIN: "/auth/login",
  REFRESH_TOKEN: "/auth/refresh-token",
  PROFILE: "/auth/profile",

  // ========== USERS ==========
  UPDATE_USERNAME: "/users/username",
  UPDATE_PASSWORD: "/users/password",

  // ========== CERTIFICATES ==========
  CERTIFICATES: "/certificates",
  CERTIFICATE_BY_ID: (id) => `/certificates/${id}`,
  CERTIFICATE_SUMMARY: "/certificates/summary",
  CERTIFICATE_HISTORY: "/certificates/history",
  CERTIFICATE_MIGRATE: "/certificates/migrate",
  CERTIFICATE_CLEAR: "/certificates/clear-all",

  // ========== TEACHERS ==========
  TEACHERS: "/teachers",
  TEACHER_BY_ID: (id) => `/teachers/${id}`,

  // ========== MODULES ==========
  MODULES: "/modules",
  MODULE_BY_ID: (id) => `/modules/${id}`,
  MODULE_STATS: "/modules/stats",

  // ========== STUDENTS ==========
  STUDENTS: "/students",
  STUDENT_BY_ID: (id) => `/students/${id}`,
  STUDENTS_SEARCH: "/students/search",
  STUDENTS_STATS: "/students/stats",
  STUDENT_TRANSFER: (id) => `/students/${id}/transfer`,
  STUDENT_MODULES: (id) => `/students/${id}/modules`,

  // ========== BRANCHES ==========
  BRANCHES: "/branches",
  BRANCHES_STATS: "/branches/stats",

  // ========== PRINTED CERTIFICATES ==========
  PRINTED_CERTS: "/printed-certificates",
  PRINTED_CERT_MODULES: "/printed-certificates/modules",
  PRINTED_CERT_HISTORY: "/printed-certificates/history",

  // ========== LOGS ==========
  LOGS: "/logs",
  LOGS_BY_CERT: (id) => `/logs/certificate/${id}`,

  // ========== EXPORT ==========
  EXPORT_ALL: "/export/all",
  EXPORT_CERTIFICATES: "/export/certificates",
  EXPORT_LOGS: "/export/logs",
  EXPORT_TEACHERS: "/export/teachers",
  EXPORT_MODULES: "/export/modules",
  EXPORT_PRINTED: "/export/printed-certificates",
  EXPORT_STUDENTS: "/export/students",
};

// =====================================================
// HTTP STATUS CODES
// =====================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// =====================================================
// ERROR MESSAGES
// =====================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",
  UNAUTHORIZED: "Your session has expired. Please login again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NOT_FOUND: "Resource not found.",
  CONFLICT: "This resource already exists.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
};

// =====================================================
// VALIDATION RULES
// =====================================================

export const VALIDATION = {
  // Certificate ID
  CERTIFICATE_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9_-]+$/,
  },

  // Username
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9_]+$/,
  },

  // Password
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },

  // Teacher name
  TEACHER_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },

  // Student name
  STUDENT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },

  // Module code & name
  MODULE_CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  MODULE_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },

  // Age range
  AGE: {
    MIN: 3,
    MAX: 18,
  },

  // Stock amounts
  STOCK: {
    MIN: 0,
    MAX: 999999,
  },
};

// =====================================================
// DATE FORMATS
// =====================================================

export const DATE_FORMATS = {
  DISPLAY: "dd MMM yyyy",
  DISPLAY_WITH_TIME: "dd MMM yyyy HH:mm",
  INPUT: "yyyy-MM-dd",
  FULL: "dd MMMM yyyy HH:mm:ss",
  TIME_ONLY: "HH:mm",
};

// =====================================================
// ROUTES
// =====================================================

export const ROUTES = {
  // Auth
  LOGIN: "/login",
  PROFILE: "/profile",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_CERTIFICATES: "/admin/certificates",
  ADMIN_TEACHERS: "/admin/teachers",
  ADMIN_MODULES: "/admin/modules",
  ADMIN_STUDENTS: "/admin/students",
  ADMIN_LOGS: "/admin/logs",

  // Teacher
  TEACHER_DASHBOARD: "/teacher/dashboard",
  TEACHER_PRINT: "/teacher/print",
  TEACHER_HISTORY: "/teacher/history",
};

// =====================================================
// TOAST NOTIFICATION DEFAULTS
// =====================================================

export const TOAST_CONFIG = {
  POSITION: ENV.TOAST_POSITION,
  DURATION: ENV.TOAST_DURATION,
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  LOADING_DURATION: Infinity,
};

// =====================================================
// FILE UPLOAD
// =====================================================

export const FILE_UPLOAD = {
  MAX_SIZE: ENV.MAX_FILE_SIZE, // bytes
  MAX_SIZE_MB: ENV.MAX_FILE_SIZE / 1024 / 1024, // MB
  ALLOWED_TYPES: {
    IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    DOCUMENT: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    EXCEL: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  },
};

// =====================================================
// THEME
// =====================================================

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
};

// =====================================================
// STUDENT STATUS
// =====================================================

export const STUDENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  GRADUATED: "graduated",
  TRANSFERRED: "transferred",
};

export const STUDENT_STATUS_LABELS = {
  [STUDENT_STATUS.ACTIVE]: "Active",
  [STUDENT_STATUS.INACTIVE]: "Inactive",
  [STUDENT_STATUS.GRADUATED]: "Graduated",
  [STUDENT_STATUS.TRANSFERRED]: "Transferred",
};

// =====================================================
// UTILITY CONSTANTS
// =====================================================

export const DEBOUNCE_DELAY = 300; // ms
export const THROTTLE_DELAY = 500; // ms
export const SESSION_CHECK_INTERVAL = 60000; // 1 minute

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  API_CONFIG,
  STORAGE_KEYS,
  USER_ROLES,
  ROLE_LABELS,
  BRANCHES,
  BRANCH_LABELS,
  BRANCH_OPTIONS,
  DIVISIONS,
  DIVISION_LABELS,
  DIVISION_OPTIONS,
  PAGINATION,
  LOG_ACTION_TYPES,
  LOG_ACTION_LABELS,
  ENDPOINTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  VALIDATION,
  DATE_FORMATS,
  ROUTES,
  TOAST_CONFIG,
  FILE_UPLOAD,
  THEME,
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  DEBOUNCE_DELAY,
  THROTTLE_DELAY,
  SESSION_CHECK_INTERVAL,
};
