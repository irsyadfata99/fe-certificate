import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, BookOpen, TrendingUp, ArrowRight, AlertCircle, Package, Award, RefreshCw } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { getCertificates, getStockSummary } from "@api/certificateApi";
import { getTeachers } from "@api/teacherApi";
import { getModules } from "@api/moduleApi";
import { getLogs } from "@api/logsApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const Dashboard = () => {
  const navigate = useNavigate();
  const { getUserDisplayName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalMedals: 0,
    totalTeachers: 0,
    totalModules: 0,
    stockSummary: null,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data
        const [certificatesRes, teachersRes, modulesRes, stockRes, logsRes] = await Promise.allSettled([
          getCertificates({ limit: 1 }),
          getTeachers({ limit: 1 }),
          getModules({ limit: 1 }),
          getStockSummary(),
          getLogs({ limit: 5, offset: 0 }), // Get 5 most recent logs
        ]);

        // Check for failures
        const failures = [certificatesRes, teachersRes, modulesRes, stockRes, logsRes].filter((res) => res.status === "rejected");

        if (failures.length > 0) {
          console.warn("Some dashboard data failed to load:", failures);
        }

        // Process stock summary
        let processedStock = null;
        let totalCertificates = 0;
        let totalMedals = 0;

        if (stockRes.status === "fulfilled" && stockRes.value?.data) {
          const stockData = stockRes.value.data;

          if (stockData.total_stock) {
            processedStock = {
              SND: {
                certificates: stockData.total_stock.snd?.certificates || 0,
                medals: stockData.total_stock.snd?.medals || 0,
              },
              MKW: {
                certificates: stockData.total_stock.mkw?.certificates || 0,
                medals: stockData.total_stock.mkw?.medals || 0,
              },
              KBP: {
                certificates: stockData.total_stock.kbp?.certificates || 0,
                medals: stockData.total_stock.kbp?.medals || 0,
              },
            };

            // Calculate totals
            totalCertificates = processedStock.SND.certificates + processedStock.MKW.certificates + processedStock.KBP.certificates;

            totalMedals = processedStock.SND.medals + processedStock.MKW.medals + processedStock.KBP.medals;
          }
        }

        // Process recent logs (only certificate-related activities)
        let processedLogs = [];
        if (logsRes.status === "fulfilled" && logsRes.value?.data) {
          processedLogs = logsRes.value.data;
        }

        // Extract teachers total
        let totalTeachers = 0;
        if (teachersRes.status === "fulfilled") {
          const teachersData = teachersRes.value;
          // Try different possible response structures
          totalTeachers = teachersData?.pagination?.total || teachersData?.meta?.pagination?.total || teachersData?.total || 0;

          console.log("Teachers response:", teachersData);
          console.log("Total teachers:", totalTeachers);
        }

        // Extract modules total
        let totalModules = 0;
        if (modulesRes.status === "fulfilled") {
          const modulesData = modulesRes.value;
          // Try different possible response structures
          totalModules = modulesData?.pagination?.total || modulesData?.meta?.pagination?.total || modulesData?.total || 0;

          console.log("Modules response:", modulesData);
          console.log("Total modules:", totalModules);
        }

        setStats({
          totalCertificates,
          totalMedals,
          totalTeachers,
          totalModules,
          stockSummary: processedStock,
        });

        setRecentLogs(processedLogs);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Stats cards configuration
  const statsCards = [
    {
      title: "Total Certificates",
      value: formatNumber(stats.totalCertificates),
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
      description: "All branches",
    },
    {
      title: "Total Medals",
      value: formatNumber(stats.totalMedals),
      icon: Award,
      gradient: "from-yellow-500 to-orange-500",
      description: "All branches",
    },
    {
      title: "Total Teachers",
      value: formatNumber(stats.totalTeachers),
      icon: Users,
      gradient: "from-green-500 to-emerald-500",
      description: "Active users",
    },
    {
      title: "Total Modules",
      value: formatNumber(stats.totalModules),
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      description: "Learning modules",
    },
  ];

  // Helper function to get activity icon based on action type
  const getActivityIcon = (actionType) => {
    switch (actionType) {
      case "CREATE":
        return <Package className="w-5 h-5 text-white" />;
      case "MIGRATE":
        return <RefreshCw className="w-5 h-5 text-white" />;
      case "UPDATE":
        return <FileText className="w-5 h-5 text-white" />;
      default:
        return <FileText className="w-5 h-5 text-white" />;
    }
  };

  // Helper function to get activity gradient based on action type
  const getActivityGradient = (actionType) => {
    switch (actionType) {
      case "CREATE":
        return "from-green-500 to-emerald-500";
      case "MIGRATE":
        return "from-purple-500 to-pink-500";
      case "UPDATE":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  // Helper function to format activity description
  const getActivityDescription = (log) => {
    const certText = log.certificate_amount > 0 ? `${log.certificate_amount} certificates` : "";
    const medalText = log.medal_amount > 0 ? `${log.medal_amount} medals` : "";

    const amounts = [certText, medalText].filter(Boolean).join(" and ");

    if (log.action_type === "MIGRATE" && log.from_branch && log.to_branch) {
      return `${amounts} migrated from ${log.from_branch} to ${log.to_branch}`;
    }

    if (log.action_type === "CREATE") {
      const branch = log.new_values?.jumlah_sertifikat_snd ? "SND" : log.new_values?.jumlah_sertifikat_mkw ? "MKW" : log.new_values?.jumlah_sertifikat_kbp ? "KBP" : "";
      return `${amounts} added${branch ? ` to ${branch}` : ""}`;
    }

    return log.description || "Certificate activity";
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Dashboard</h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()} size="medium">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="space-y-4">
      {/* Header - Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h1 className="text-2xl font-bold text-primary">Welcome back, {getUserDisplayName()}! 👋</h1>
        <p className="text-secondary mt-1">Here's what's happening with your system today.</p>
      </div>

      {/* Stats Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform">{stat.value}</p>
                  <p className="text-xs text-secondary mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Summary - Glassmorphism */}
      {stats.stockSummary && Object.keys(stats.stockSummary).length > 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <h2 className="text-lg font-semibold text-primary mb-4">Stock Summary by Branch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.stockSummary).map(([branch, stock]) => (
              <div key={branch} className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-primary">{branch}</h3>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <Award className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span className="text-sm text-secondary">Certificates</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{formatNumber(stock.certificates)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-3 h-3 text-yellow-500" />
                      <span className="text-sm text-secondary">Medals</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{formatNumber(stock.medals)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity - Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h2 className="text-lg font-semibold text-primary mb-4">Recent Activity</h2>

        {recentLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-4 border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getActivityGradient(log.action_type)} shadow-md flex-shrink-0`}>{getActivityIcon(log.action_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{log.certificate_id}</p>
                  <p className="text-sm text-secondary mt-0.5">{getActivityDescription(log)}</p>
                  {log.performed_by && <p className="text-xs text-secondary mt-1">by {log.performed_by}</p>}
                </div>
                <p className="text-sm text-secondary whitespace-nowrap">{formatDate(log.created_at, DATE_FORMATS.DISPLAY)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-white/5">
          <Button variant="ghost" size="small" onClick={() => navigate("/admin/logs")} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            View All Activity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
