import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  BookOpen,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { getCertificates, getStockSummary } from "@api/certificateApi";
import { getTeachers } from "@api/teacherApi";
import { getModules } from "@api/moduleApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const Dashboard = () => {
  const navigate = useNavigate();
  const { getUserDisplayName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalTeachers: 0,
    totalModules: 0,
    stockSummary: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [certificatesRes, teachersRes, modulesRes, stockRes] =
          await Promise.allSettled([
            getCertificates({ limit: 1 }),
            getTeachers({ limit: 1 }),
            getModules({ limit: 1 }),
            getStockSummary(), // ✅ This now calls /api/certificates/summary
          ]);

        // Check for critical failures
        const failures = [
          certificatesRes,
          teachersRes,
          modulesRes,
          stockRes,
        ].filter((res) => res.status === "rejected");

        if (failures.length > 0) {
          console.warn("Some dashboard data failed to load:", failures);
        }

        // ✅ FIXED: Process stock summary correctly
        // Backend returns:
        // {
        //   total_stock: {
        //     snd: { certificates: 1650, medals: 1650 },
        //     mkw: { certificates: 250, medals: 250 },
        //     kbp: { certificates: 150, medals: 150 }
        //   },
        //   grand_total: { certificates: 2050, medals: 2050 }
        // }
        let processedStock = null;
        if (stockRes.status === "fulfilled" && stockRes.value?.data) {
          const stockData = stockRes.value.data;

          if (stockData.total_stock) {
            processedStock = {
              SND: stockData.total_stock.snd?.certificates || 0,
              MKW: stockData.total_stock.mkw?.certificates || 0,
              KBP: stockData.total_stock.kbp?.certificates || 0,
            };
          }
        }

        setStats({
          totalCertificates:
            certificatesRes.status === "fulfilled"
              ? certificatesRes.value?.pagination?.total || 0
              : 0,
          totalTeachers:
            teachersRes.status === "fulfilled"
              ? teachersRes.value?.pagination?.total || 0
              : 0,
          totalModules:
            modulesRes.status === "fulfilled"
              ? modulesRes.value?.pagination?.total || 0
              : 0,
          stockSummary: processedStock,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    {
      title: "Total Certificates",
      value: formatNumber(stats.totalCertificates),
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Teachers",
      value: formatNumber(stats.totalTeachers),
      icon: Users,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Total Modules",
      value: formatNumber(stats.totalModules),
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Active Branches",
      value: 3, // SND, MKW, KBP
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
    },
  ];

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
          <h3 className="text-lg font-semibold text-primary mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            size="medium"
          >
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
      {/* Header */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-secondary text-sm mt-1">
          Here's what's happening with your system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-secondary">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1 group-hover:scale-105 transition-transform">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Summary */}
      {stats.stockSummary && Object.keys(stats.stockSummary).length > 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <h2 className="text-sm font-semibold text-primary mb-3">
            Stock Summary by Branch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(stats.stockSummary).map(([branch, stock]) => (
              <div
                key={branch}
                className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-3 rounded-xl border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-primary">
                    {branch}
                  </h3>
                  <FileText className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-xl font-bold text-primary">
                  {formatNumber(stock)}
                </p>
                <p className="text-xs text-secondary">Available certificates</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h2 className="text-sm font-semibold text-primary mb-3">
          Recent Activity
        </h2>
        <div className="space-y-2">
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-2 border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">
                New certificate batch added
              </p>
              <p className="text-xs text-secondary">
                50 certificates added to SND
              </p>
            </div>
            <p className="text-xs text-secondary whitespace-nowrap">
              {formatDate(new Date(), DATE_FORMATS.DISPLAY)}
            </p>
          </div>

          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-2 border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">
                New teacher registered
              </p>
              <p className="text-xs text-secondary">Teacher added to MKW</p>
            </div>
            <p className="text-xs text-secondary whitespace-nowrap">
              {formatDate(new Date(), DATE_FORMATS.DISPLAY)}
            </p>
          </div>

          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-2 border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">Module updated</p>
              <p className="text-xs text-secondary">
                Age range modified for JK-001
              </p>
            </div>
            <p className="text-xs text-secondary whitespace-nowrap">
              {formatDate(new Date(), DATE_FORMATS.DISPLAY)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-white/5">
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate("/admin/logs")}
            icon={<ArrowRight className="w-3 h-3" />}
            iconPosition="right"
          >
            View All Activity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
