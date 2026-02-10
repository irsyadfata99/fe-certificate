/**
 * Custom Hooks Barrel Export
 * Centralized export for all custom hooks
 */

export { useAuth, default as useAuthDefault } from "./useAuth";
export { useApi, default as useApiDefault } from "./useApi";
export {
  usePagination,
  default as usePaginationDefault,
} from "./usePagination";
export { useForm, default as useFormDefault } from "./useForm";
export {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useThrottledCallback,
} from "./useDebounce";
export { useConfirm, default as useConfirmDefault } from "./useConfirm";
export { useLocalStorage, useSessionStorage } from "./useLocalStorage";
export { useTeachers, default as useTeachersDefault } from "./useTeachers";
export { useModules, default as useModulesDefault } from "./useModules";
export { useStudents, default as useStudentsDefault } from "./useStudents";
export {
  useTeacherStats,
  default as useTeacherStatsDefault,
} from "./useTeacherStats";
export {
  useStockAlert,
  default as useStockAlertDefault,
} from "./useStockAlert";
