// src/hooks/useModules.js
import { useState, useEffect, useCallback } from "react";
import { getModules, getModuleStats } from "@api/moduleApi";
import { useModuleStore } from "@store/moduleStore";

/**
 * Custom hook for managing modules
 */
export const useModules = (autoFetch = true) => {
  const {
    modules,
    pagination,
    filters,
    stats,
    isLoading,
    error,
    setModules,
    setStats,
    setLoading,
    setError,
  } = useModuleStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModules = useCallback(
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

        const response = await getModules(queryParams);

        if (response.success) {
          setModules(response.data, response.meta?.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch modules");
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.limit,
      pagination.offset,
      filters,
      setModules,
      setLoading,
      setError,
    ],
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await getModuleStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch module stats:", err);
    }
  }, [setStats]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchModules(), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchModules, fetchStats]);

  useEffect(() => {
    if (autoFetch) {
      fetchModules();
      fetchStats();
    }
  }, [autoFetch, fetchModules, fetchStats]);

  return {
    modules,
    pagination,
    filters,
    stats,
    isLoading,
    isRefreshing,
    error,
    fetchModules,
    fetchStats,
    refresh,
  };
};

export default useModules;
