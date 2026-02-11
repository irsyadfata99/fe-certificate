import { Award, FileText, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { formatNumber } from "@utils/formatters";

/**
 * StockAlert Component
 * Displays stock availability alerts for teacher's branches
 */
const StockAlert = ({ alerts, isLoading, onRefresh, className = "" }) => {
  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Get gradient color based on alert level
   */
  const getAlertGradient = (level) => {
    const gradients = {
      ok: "from-green-500 to-emerald-500",
      warning: "from-yellow-500 to-orange-500",
      critical: "from-red-500 to-pink-500",
    };
    return gradients[level] || gradients.ok;
  };

  /**
   * Get background color based on alert level
   */
  const getAlertBgColor = (level) => {
    const colors = {
      ok: "bg-green-500/10 dark:bg-green-500/10 border-green-500/30",
      warning: "bg-yellow-500/10 dark:bg-yellow-500/10 border-yellow-500/30",
      critical: "bg-red-500/10 dark:bg-red-500/10 border-red-500/30",
    };
    return colors[level] || colors.ok;
  };

  /**
   * Get icon based on alert level
   */
  const getAlertIcon = (level) => {
    const icons = {
      ok: <CheckCircle className="w-5 h-5 text-white" />,
      warning: <AlertCircle className="w-5 h-5 text-white" />,
      critical: <AlertCircle className="w-5 h-5 text-white" />,
    };
    return icons[level] || icons.ok;
  };

  /**
   * Get title based on overall severity
   */
  const getOverallTitle = () => {
    const hasCritical = alerts.some((a) => a.level === "critical");
    const hasWarning = alerts.some((a) => a.level === "warning");

    if (hasCritical) return "⚠️ Critical Stock Alert";
    if (hasWarning) return "⚠️ Low Stock Warning";
    return "✅ Stock Status";
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (isLoading) {
    return (
      <div className={`backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Spinner size="medium" />
        </div>
      </div>
    );
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!alerts || alerts.length === 0) {
    return (
      <div className={`backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg ${className}`}>
        <div className="text-center py-8">
          <p className="text-secondary">No stock data available</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className={`backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Award className="w-5 h-5" />
          {getOverallTitle()}
        </h2>
        {onRefresh && (
          <Button variant="ghost" size="small" onClick={onRefresh} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        )}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <div key={alert.branchCode} className={`backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border transition-all hover:bg-white/30 dark:hover:bg-white/10 ${getAlertBgColor(alert.level)}`}>
            {/* Branch Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getAlertGradient(alert.level)} shadow-md`}>{getAlertIcon(alert.level)}</div>
                <div>
                  <h3 className="text-base font-semibold text-primary">{alert.branchCode}</h3>
                  <p className="text-xs text-secondary">{alert.branchName}</p>
                </div>
              </div>
            </div>

            {/* Stock Details */}
            <div className="space-y-2">
              {/* Medals */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-secondary">Medals</span>
                </div>
                <span className={`text-lg font-bold ${alert.level === "critical" ? "text-red-600 dark:text-red-400" : alert.level === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                  {formatNumber(alert.medals)}
                </span>
              </div>

              {/* Certificates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-secondary">Certificates</span>
                </div>
                <span className="text-lg font-bold text-primary">{formatNumber(alert.certificates)}</span>
              </div>
            </div>

            {/* Alert Message */}
            {alert.level !== "ok" && (
              <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-white/5">
                <p className="text-xs text-secondary">{alert.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer (if multiple branches) */}
      {alerts.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Total across all branches:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-primary">{formatNumber(alerts.reduce((sum, a) => sum + a.certificates, 0))} certs</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-primary">{formatNumber(alerts.reduce((sum, a) => sum + a.medals, 0))} medals</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlert;
