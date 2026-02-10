import { TrendingUp, BookOpen, Award } from "lucide-react";
import { formatNumber } from "@utils/formatters";

/**
 * DivisionBreakdown Component
 * Displays statistics breakdown by division (JK vs LK)
 */
const DivisionBreakdown = ({ stats, className = "" }) => {
  // =====================================================
  // DIVISION CONFIG
  // =====================================================

  const divisions = [
    {
      code: "JK",
      name: "Junior Koders",
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: BookOpen,
      ageRange: "8-16 years",
    },
    {
      code: "LK",
      name: "Little Koders",
      gradient: "from-pink-500 to-purple-500",
      bgColor: "bg-pink-500/10 dark:bg-pink-500/10",
      borderColor: "border-pink-500/30",
      icon: Award,
      ageRange: "4-8 years",
    },
  ];

  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Get division statistics
   */
  const getDivisionStats = (divisionCode) => {
    if (!stats?.prints?.byDivision) {
      return {
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
      };
    }

    return {
      total: stats.prints.byDivision[divisionCode] || 0,
      thisWeek: 0, // Will be calculated from stats if available
      thisMonth: 0,
    };
  };

  /**
   * Calculate percentage of total
   */
  const getPercentage = (value) => {
    if (!stats?.prints?.total || stats.prints.total === 0) return 0;
    return ((value / stats.prints.total) * 100).toFixed(1);
  };

  /**
   * Get comparison indicator
   */
  const getComparisonIndicator = (divisionCode) => {
    const divisionCount = stats?.prints?.byDivision?.[divisionCode] || 0;
    const otherCode = divisionCode === "JK" ? "LK" : "JK";
    const otherCount = stats?.prints?.byDivision?.[otherCode] || 0;

    if (divisionCount > otherCount) {
      return { text: "Leading", color: "text-green-600 dark:text-green-400" };
    } else if (divisionCount < otherCount) {
      return { text: "Behind", color: "text-yellow-600 dark:text-yellow-400" };
    } else {
      return { text: "Equal", color: "text-blue-600 dark:text-blue-400" };
    }
  };

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!stats || !stats.prints) {
    return (
      <div
        className={`backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg ${className}`}
      >
        <div className="text-center py-8">
          <p className="text-secondary">No division data available</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div
      className={`backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-primary">
          Division Breakdown
        </h2>
      </div>

      {/* Division Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {divisions.map((division) => {
          const divisionStats = getDivisionStats(division.code);
          const percentage = getPercentage(divisionStats.total);
          const comparison = getComparisonIndicator(division.code);
          const Icon = division.icon;

          return (
            <div
              key={division.code}
              className={`backdrop-blur-sm bg-white/20 dark:bg-white/5 p-5 rounded-xl border transition-all hover:bg-white/30 dark:hover:bg-white/10 ${division.bgColor} ${division.borderColor}`}
            >
              {/* Division Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${division.gradient} shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-primary">
                        {division.code}
                      </h3>
                      <p className="text-xs text-secondary">{division.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary ml-11">
                    {division.ageRange}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${comparison.color}`}>
                    {comparison.text}
                  </span>
                </div>
              </div>

              {/* Main Stats */}
              <div className="space-y-3">
                {/* Total Prints */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary">Total Prints</span>
                    <span className="text-xs text-secondary">
                      {percentage}% of total
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {formatNumber(divisionStats.total)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${division.gradient} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Additional Stats Grid */}
                {(stats.prints.thisWeek > 0 || stats.prints.thisMonth > 0) && (
                  <div className="pt-3 border-t border-gray-200/30 dark:border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                      {/* This Week */}
                      <div>
                        <p className="text-xs text-secondary mb-1">This Week</p>
                        <p className="text-lg font-bold text-primary">
                          {formatNumber(divisionStats.thisWeek)}
                        </p>
                      </div>
                      {/* This Month */}
                      <div>
                        <p className="text-xs text-secondary mb-1">
                          This Month
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatNumber(divisionStats.thisMonth)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary">Total Prints (All Divisions):</span>
          <span className="text-lg font-bold text-primary">
            {formatNumber(stats.prints.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DivisionBreakdown;
