// src/hooks/useStudents.js
import { useState, useEffect, useCallback } from "react";
import { getStudents, getStudentStats } from "@api/studentsApi";
import { useStudentStore } from "@store/studentStore";

/**
 * Custom hook for managing students
 */
export const useStudents = (autoFetch = true) => {
  const {
    students,
    pagination,
    filters,
    stats,
    isLoading,
    error,
    setStudents,
    setStats,
    setLoading,
    setError,
  } = useStudentStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStudents = useCallback(
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

        const response = await getStudents(queryParams);

        if (response.success) {
          setStudents(response.data, response.meta?.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.limit,
      pagination.offset,
      filters,
      setStudents,
      setLoading,
      setError,
    ],
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await getStudentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch student stats:", err);
    }
  }, [setStats]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStudents(), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchStudents, fetchStats]);

  useEffect(() => {
    if (autoFetch) {
      fetchStudents();
      fetchStats();
    }
  }, [autoFetch, fetchStudents, fetchStats]);

  return {
    students,
    pagination,
    filters,
    stats,
    isLoading,
    isRefreshing,
    error,
    fetchStudents,
    fetchStats,
    refresh,
  };
};

export default useStudents;
