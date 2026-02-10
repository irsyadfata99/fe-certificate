import { getStockSummary } from "./certificateApi";
import { getPrintHistory } from "./printedCertApi";
import { handleApiError } from "@utils/errorHandler";

/**
 * Teacher Stats API Helper
 * Aggregates data from multiple endpoints for teacher dashboard
 */

/**
 * Get comprehensive teacher statistics
 * Aggregates: stock, print history, module usage
 * @param {Object} teacherInfo - Teacher information from auth
 * @returns {Promise<Object>} Aggregated statistics
 */
export const getTeacherDashboardStats = async (teacherInfo) => {
  try {
    const { branches, divisions } = teacherInfo;

    // Get teacher's branch codes
    const branchCodes = Array.isArray(branches)
      ? branches.map((b) => b.branch_code || b)
      : [teacherInfo.teacherBranch].filter(Boolean);

    // Fetch data in parallel
    const [stockRes, printHistoryRes] = await Promise.allSettled([
      getStockSummary(),
      getPrintHistory({ limit: 100, offset: 0 }),
    ]);

    // Process stock data
    let stockByBranch = {};
    let totalCertificates = 0;
    let totalMedals = 0;

    if (stockRes.status === "fulfilled" && stockRes.value?.data) {
      const stockData = stockRes.value.data;

      if (stockData.stock_by_branch) {
        // Filter stock for teacher's branches only
        branchCodes.forEach((branchCode) => {
          if (stockData.stock_by_branch[branchCode]) {
            const branchStock = stockData.stock_by_branch[branchCode];
            stockByBranch[branchCode] = {
              certificates: branchStock.certificates || 0,
              medals: branchStock.medals || 0,
              branch_name: branchStock.branch_name || branchCode,
            };

            totalCertificates += branchStock.certificates || 0;
            totalMedals += branchStock.medals || 0;
          }
        });
      }
    }

    // Process print history
    let printStats = {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byDivision: { JK: 0, LK: 0 },
      byBranch: {},
      byModule: {},
      recentPrints: [],
    };

    if (printHistoryRes.status === "fulfilled" && printHistoryRes.value?.data) {
      const prints = printHistoryRes.value.data;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );

      prints.forEach((print) => {
        const printDate = new Date(print.ptc_date || print.created_at);
        const moduleDivision = print.module_division;

        printStats.total++;

        // Time-based counts
        if (printDate >= today) printStats.today++;
        if (printDate >= weekAgo) printStats.thisWeek++;
        if (printDate >= monthAgo) printStats.thisMonth++;

        // Division breakdown
        if (
          moduleDivision &&
          printStats.byDivision.hasOwnProperty(moduleDivision)
        ) {
          printStats.byDivision[moduleDivision]++;
        }

        // Branch breakdown
        const printBranch = print.branch_code || print.teacher_branch;
        if (printBranch) {
          if (!printStats.byBranch[printBranch]) {
            printStats.byBranch[printBranch] = 0;
          }
          printStats.byBranch[printBranch]++;
        }

        // Module usage tracking
        const moduleKey = print.module_code || print.module_id;
        if (moduleKey) {
          if (!printStats.byModule[moduleKey]) {
            printStats.byModule[moduleKey] = {
              code: print.module_code,
              name: print.module_name,
              division: moduleDivision,
              count: 0,
            };
          }
          printStats.byModule[moduleKey].count++;
        }
      });

      // Get recent prints (last 5)
      printStats.recentPrints = prints.slice(0, 5).map((print) => ({
        id: print.id,
        student_name: print.student_name,
        module_code: print.module_code,
        module_name: print.module_name,
        division: print.module_division,
        branch: print.branch_code || print.teacher_branch,
        date: print.ptc_date || print.created_at,
        certificate_id: print.certificate_id,
      }));
    }

    // Get top modules (sorted by usage)
    const topModules = Object.values(printStats.byModule)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        stock: {
          byBranch: stockByBranch,
          total: {
            certificates: totalCertificates,
            medals: totalMedals,
          },
        },
        prints: printStats,
        topModules,
        teacherInfo: {
          branches: branchCodes,
          divisions: divisions || [],
        },
      },
    };
  } catch (error) {
    handleApiError(error, { showToast: false });
    throw error;
  }
};

/**
 * Get stock alerts for teacher's branches
 * @param {Object} teacherInfo - Teacher information
 * @param {number} lowStockThreshold - Threshold for low stock warning (default: 50)
 * @returns {Promise<Object>} Stock alerts
 */
export const getStockAlerts = async (teacherInfo, lowStockThreshold = 50) => {
  try {
    const stockRes = await getStockSummary();

    if (!stockRes?.data?.stock_by_branch) {
      return {
        success: true,
        data: {
          hasAlerts: false,
          alerts: [],
        },
      };
    }

    const { branches } = teacherInfo;
    const branchCodes = Array.isArray(branches)
      ? branches.map((b) => b.branch_code || b)
      : [teacherInfo.teacherBranch].filter(Boolean);

    const alerts = [];

    branchCodes.forEach((branchCode) => {
      const branchStock = stockRes.data.stock_by_branch[branchCode];

      if (branchStock) {
        const medalCount = branchStock.medals || 0;

        let level = "ok";
        let message = "";

        if (medalCount === 0) {
          level = "critical";
          message = `No medals available at ${branchCode}`;
        } else if (medalCount < 10) {
          level = "critical";
          message = `Critical: Only ${medalCount} medals left at ${branchCode}`;
        } else if (medalCount < lowStockThreshold) {
          level = "warning";
          message = `Low stock: ${medalCount} medals at ${branchCode}`;
        } else {
          level = "ok";
          message = `Stock OK: ${medalCount} medals at ${branchCode}`;
        }

        alerts.push({
          branchCode,
          branchName: branchStock.branch_name || branchCode,
          medals: medalCount,
          certificates: branchStock.certificates || 0,
          level,
          message,
        });
      }
    });

    const hasAlerts = alerts.some((a) => a.level !== "ok");

    return {
      success: true,
      data: {
        hasAlerts,
        alerts,
        threshold: lowStockThreshold,
      },
    };
  } catch (error) {
    handleApiError(error, { showToast: false });
    throw error;
  }
};

/**
 * Get division statistics for teacher
 * @param {Object} teacherInfo - Teacher information
 * @returns {Promise<Object>} Division breakdown
 */
export const getDivisionStats = async (teacherInfo) => {
  try {
    const printHistoryRes = await getPrintHistory({ limit: 100, offset: 0 });

    const stats = {
      JK: { total: 0, thisWeek: 0, thisMonth: 0 },
      LK: { total: 0, thisWeek: 0, thisMonth: 0 },
    };

    if (printHistoryRes?.data) {
      const prints = printHistoryRes.data;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );

      prints.forEach((print) => {
        const division = print.module_division;
        const printDate = new Date(print.ptc_date || print.created_at);

        if (division && stats[division]) {
          stats[division].total++;
          if (printDate >= weekAgo) stats[division].thisWeek++;
          if (printDate >= monthAgo) stats[division].thisMonth++;
        }
      });
    }

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    handleApiError(error, { showToast: false });
    throw error;
  }
};

export default {
  getTeacherDashboardStats,
  getStockAlerts,
  getDivisionStats,
};
