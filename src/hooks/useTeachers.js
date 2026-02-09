// src/hooks/useTeachers.js
import { useState, useEffect, useCallback } from "react";
import { getTeachers } from "@api/teacherApi";
import { useTeacherStore } from "@store/teacherStore";

/**
 * Custom hook for managing teachers
 */
export const useTeachers = (autoFetch = true) => {
  const {
    teachers,
    pagination,
    filters,
    isLoading,
    error,
    setTeachers,
    setLoading,
    setError,
  } = useTeacherStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTeachers = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          limit: pagination.limit,
          offset: pagination.offset,
          ...filters,
          ...params,
        };

        const response = await getTeachers(queryParams);

        if (response.success) {
          setTeachers(response.data, response.meta?.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch teachers");
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.limit,
      pagination.offset,
      filters,
      setTeachers,
      setLoading,
      setError,
    ],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTeachers();
    setIsRefreshing(false);
  }, [fetchTeachers]);

  useEffect(() => {
    if (autoFetch) {
      fetchTeachers();
    }
  }, [autoFetch, fetchTeachers]);

  return {
    teachers,
    pagination,
    filters,
    isLoading,
    isRefreshing,
    error,
    fetchTeachers,
    refresh,
  };
};

export default useTeachers;
