import { ENV } from "../config/env";

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  TIMEOUT: ENV.API_TIMEOUT,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
};

// Branches
export const BRANCHES = {
  SND: "SND",
  MKW: "MKW",
  KBP: "KBP",
};

// Divisions
export const DIVISIONS = {
  JK: "JK",
  LK: "LK",
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
};

// Action Types for Logs
export const LOG_ACTION_TYPES = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  DELETE_ALL: "DELETE_ALL",
  MIGRATE: "MIGRATE",
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REFRESH_TOKEN: "/auth/refresh-token",
  PROFILE: "/auth/profile",

  // Users
  UPDATE_USERNAME: "/users/username",
  UPDATE_PASSWORD: "/users/password",

  // Certificates
  CERTIFICATES: "/certificates",
  CERTIFICATE_BY_ID: (id) => `/certificates/${id}`,
  CERTIFICATE_SUMMARY: "/certificates/summary",
  CERTIFICATE_HISTORY: "/certificates/history",
  CERTIFICATE_MIGRATE: "/certificates/migrate",
  CERTIFICATE_CLEAR: "/certificates/clear-all",

  // Teachers
  TEACHERS: "/teachers",
  TEACHER_BY_ID: (id) => `/teachers/${id}`,

  // Modules
  MODULES: "/modules",
  MODULE_BY_ID: (id) => `/modules/${id}`,
  MODULE_STATS: "/modules/stats",

  // Printed Certificates
  PRINTED_CERTS: "/printed-certificates",
  PRINTED_CERT_MODULES: "/printed-certificates/modules",
  PRINTED_CERT_HISTORY: "/printed-certificates/history",

  // Logs
  LOGS: "/logs",
  LOGS_BY_CERT: (id) => `/logs/certificate/${id}`,

  // Export
  EXPORT_ALL: "/export/all",
  EXPORT_CERTIFICATES: "/export/certificates",
  EXPORT_LOGS: "/export/logs",
  EXPORT_TEACHERS: "/export/teachers",
  EXPORT_MODULES: "/export/modules",
  EXPORT_PRINTED: "/export/printed-certificates",
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Your session has expired. Please login again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NOT_FOUND: "Resource not found.",
};
