import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getStockAlerts } from "@api/teacherStatsApi";
import { ENV } from "@config/env";

/**
 * useStockAlert Hook
 * Monitors stock levels and provides alerts for low stock
 *
 * @param {Object} options - Hook options
 * @returns {Object} Stock alert data and methods
 */
export const useStockAlert = (options = {}) => {
  const {
    autoFetch = true,
    lowStockThreshold = 50,
    criticalStockThreshold = 10,
    refreshInterval = null,
  } = options;

  const { user } = useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  // =====================================================
  // FETCH ALERTS
  // =====================================================

  /**
   * Fetch stock alerts
   */
  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      ENV.ENABLE_LOGGING && console.log("🔔 Checking stock alerts...");

      const teacherInfo = {
        branches: user.branches || [],
        divisions: user.divisions || [],
        teacherBranch: user.teacherBranch,
      };

      const response = await getStockAlerts(teacherInfo, lowStockThreshold);

      if (response.success) {
        setAlerts(response.data.alerts || []);
        setLastCheck(new Date());

        ENV.ENABLE_LOGGING &&
          console.log(
            `✅ Stock alerts checked - ${response.data.alerts.length} branches`,
          );
      } else {
        throw new Error(response.message || "Failed to fetch alerts");
      }
    } catch (err) {
      console.error("❌ Failed to fetch stock alerts:", err);
      setError(err.message || "Failed to check stock alerts");
    } finally {
      setIsLoading(false);
    }
  }, [user, lowStockThreshold]);

  // =====================================================
  // AUTO-FETCH ON MOUNT
  // =====================================================

  useEffect(() => {
    if (autoFetch && user) {
      fetchAlerts();
    }
  }, [autoFetch, user, fetchAlerts]);

  // =====================================================
  // AUTO-REFRESH
  // =====================================================

  useEffect(() => {
    if (!refreshInterval || !user) return;

    const intervalId = setInterval(() => {
      ENV.ENABLE_LOGGING && console.log("🔄 Auto-refreshing stock alerts...");
      fetchAlerts();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, user, fetchAlerts]);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  /**
   * Get critical alerts (medals < critical threshold)
   */
  const getCriticalAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.level === "critical");
  }, [alerts]);

  /**
   * Get warning alerts (medals < low threshold but >= critical)
   */
  const getWarningAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.level === "warning");
  }, [alerts]);

  /**
   * Get OK alerts (medals >= low threshold)
   */
  const getOkAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.level === "ok");
  }, [alerts]);

  /**
   * Check if any branch has critical stock
   */
  const hasCriticalAlerts = useCallback(() => {
    return alerts.some((alert) => alert.level === "critical");
  }, [alerts]);

  /**
   * Check if any branch has warning stock
   */
  const hasWarningAlerts = useCallback(() => {
    return alerts.some((alert) => alert.level === "warning");
  }, [alerts]);

  /**
   * Check if any branch has alerts
   */
  const hasAnyAlerts = useCallback(() => {
    return alerts.some((alert) => alert.level !== "ok");
  }, [alerts]);

  /**
   * Get alert for specific branch
   */
  const getAlertForBranch = useCallback(
    (branchCode) => {
      return alerts.find((alert) => alert.branchCode === branchCode) || null;
    },
    [alerts],
  );

  /**
   * Get total medals across all branches
   */
  const getTotalMedals = useCallback(() => {
    return alerts.reduce((sum, alert) => sum + alert.medals, 0);
  }, [alerts]);

  /**
   * Get total certificates across all branches
   */
  const getTotalCertificates = useCallback(() => {
    return alerts.reduce((sum, alert) => sum + alert.certificates, 0);
  }, [alerts]);

  /**
   * Get lowest stock branch
   */
  const getLowestStockBranch = useCallback(() => {
    if (alerts.length === 0) return null;

    return alerts.reduce((lowest, current) => {
      return current.medals < lowest.medals ? current : lowest;
    });
  }, [alerts]);

  /**
   * Get highest stock branch
   */
  const getHighestStockBranch = useCallback(() => {
    if (alerts.length === 0) return null;

    return alerts.reduce((highest, current) => {
      return current.medals > highest.medals ? current : highest;
    });
  }, [alerts]);

  /**
   * Get alert severity (overall)
   */
  const getOverallSeverity = useCallback(() => {
    if (hasCriticalAlerts()) return "critical";
    if (hasWarningAlerts()) return "warning";
    return "ok";
  }, [hasCriticalAlerts, hasWarningAlerts]);

  /**
   * Get alert color class based on level
   */
  const getAlertColor = useCallback((level) => {
    const colors = {
      ok: "from-green-500 to-emerald-500",
      warning: "from-yellow-500 to-orange-500",
      critical: "from-red-500 to-pink-500",
    };
    return colors[level] || colors.ok;
  }, []);

  /**
   * Get alert icon based on level
   */
  const getAlertIcon = useCallback((level) => {
    const icons = {
      ok: "✅",
      warning: "⚠️",
      critical: "❌",
    };
    return icons[level] || icons.ok;
  }, []);

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Refresh alerts manually
   */
  const refresh = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  /**
   * Check if data is stale (older than 5 minutes)
   */
  const isStale = useCallback(() => {
    if (!lastCheck) return true;

    const STALE_TIME = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastCheck.getTime() > STALE_TIME;
  }, [lastCheck]);

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // State
    alerts,
    isLoading,
    error,
    lastCheck,

    // Computed values
    criticalAlerts: getCriticalAlerts(),
    warningAlerts: getWarningAlerts(),
    okAlerts: getOkAlerts(),
    hasCriticalAlerts: hasCriticalAlerts(),
    hasWarningAlerts: hasWarningAlerts(),
    hasAnyAlerts: hasAnyAlerts(),
    overallSeverity: getOverallSeverity(),
    totalMedals: getTotalMedals(),
    totalCertificates: getTotalCertificates(),
    lowestStockBranch: getLowestStockBranch(),
    highestStockBranch: getHighestStockBranch(),

    // Methods
    refresh,
    fetchAlerts,
    isStale: isStale(),
    getAlertForBranch,
    getAlertColor,
    getAlertIcon,

    // Configuration
    thresholds: {
      low: lowStockThreshold,
      critical: criticalStockThreshold,
    },
  };
};

export default useStockAlert;
