import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getTeacherDashboardStats } from "@api/teacherStatsApi";
import { ENV } from "@config/env";

/**
 * useTeacherStats Hook
 * Fetches and manages comprehensive teacher statistics
 *
 * @param {Object} options - Hook options
 * @returns {Object} Stats data and methods
 */
export const useTeacherStats = (options = {}) => {
  const { autoFetch = true, refreshInterval = null } = options;

  const { user } = useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // =====================================================
  // FETCH STATS
  // =====================================================

  /**
   * Fetch teacher statistics
   */
  const fetchStats = useCallback(async () => {
    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      ENV.ENABLE_LOGGING && console.log("📊 Fetching teacher stats...");

      const teacherInfo = {
        branches: user.branches || [],
        divisions: user.divisions || [],
        teacherBranch: user.teacherBranch,
        teacherDivision: user.teacherDivision,
      };

      const response = await getTeacherDashboardStats(teacherInfo);

      if (response.success) {
        setStats(response.data);
        setLastFetch(new Date());

        ENV.ENABLE_LOGGING &&
          console.log("✅ Teacher stats fetched successfully");
      } else {
        throw new Error(response.message || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("❌ Failed to fetch teacher stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // =====================================================
  // AUTO-FETCH ON MOUNT
  // =====================================================

  useEffect(() => {
    if (autoFetch && user) {
      fetchStats();
    }
  }, [autoFetch, user, fetchStats]);

  // =====================================================
  // AUTO-REFRESH
  // =====================================================

  useEffect(() => {
    if (!refreshInterval || !user) return;

    const intervalId = setInterval(() => {
      ENV.ENABLE_LOGGING && console.log("🔄 Auto-refreshing teacher stats...");
      fetchStats();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, user, fetchStats]);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  /**
   * Check if teacher has low stock in any branch
   */
  const hasLowStock = useCallback(() => {
    if (!stats?.stock?.byBranch) return false;

    return Object.values(stats.stock.byBranch).some(
      (branch) => branch.medals < 50,
    );
  }, [stats]);

  /**
   * Check if teacher has critical stock in any branch
   */
  const hasCriticalStock = useCallback(() => {
    if (!stats?.stock?.byBranch) return false;

    return Object.values(stats.stock.byBranch).some(
      (branch) => branch.medals < 10,
    );
  }, [stats]);

  /**
   * Get total prints count
   */
  const getTotalPrints = useCallback(() => {
    return stats?.prints?.total || 0;
  }, [stats]);

  /**
   * Get prints by division
   */
  const getPrintsByDivision = useCallback(
    (division) => {
      return stats?.prints?.byDivision?.[division] || 0;
    },
    [stats],
  );

  /**
   * Get prints by branch
   */
  const getPrintsByBranch = useCallback(
    (branchCode) => {
      return stats?.prints?.byBranch?.[branchCode] || 0;
    },
    [stats],
  );

  /**
   * Get stock for specific branch
   */
  const getStockForBranch = useCallback(
    (branchCode) => {
      return stats?.stock?.byBranch?.[branchCode] || null;
    },
    [stats],
  );

  /**
   * Get top modules
   */
  const getTopModules = useCallback(
    (limit = 5) => {
      return stats?.topModules?.slice(0, limit) || [];
    },
    [stats],
  );

  /**
   * Get recent prints
   */
  const getRecentPrints = useCallback(
    (limit = 5) => {
      return stats?.prints?.recentPrints?.slice(0, limit) || [];
    },
    [stats],
  );

  /**
   * Get stats for today
   */
  const getTodayStats = useCallback(() => {
    return {
      prints: stats?.prints?.today || 0,
    };
  }, [stats]);

  /**
   * Get stats for this week
   */
  const getWeekStats = useCallback(() => {
    return {
      prints: stats?.prints?.thisWeek || 0,
    };
  }, [stats]);

  /**
   * Get stats for this month
   */
  const getMonthStats = useCallback(() => {
    return {
      prints: stats?.prints?.thisMonth || 0,
    };
  }, [stats]);

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Refresh stats manually
   */
  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  /**
   * Check if data is stale (older than 5 minutes)
   */
  const isStale = useCallback(() => {
    if (!lastFetch) return true;

    const STALE_TIME = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastFetch.getTime() > STALE_TIME;
  }, [lastFetch]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    stats,
    isLoading,
    error,
    lastFetch,

    // Computed values
    hasLowStock: hasLowStock(),
    hasCriticalStock: hasCriticalStock(),
    totalPrints: getTotalPrints(),

    // Methods
    refresh,
    fetchStats,
    isStale: isStale(),

    // Getters
    getPrintsByDivision,
    getPrintsByBranch,
    getStockForBranch,
    getTopModules,
    getRecentPrints,
    getTodayStats,
    getWeekStats,
    getMonthStats,

    // Raw data access
    stockData: stats?.stock,
    printData: stats?.prints,
    topModules: stats?.topModules,
  };
};

export default useTeacherStats;
