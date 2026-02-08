import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  History,
  User,
  MapPin,
  BookOpen,
  TrendingUp,
  Award,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { getPrintHistory } from "@api/printedCertApi";
import {
  formatNumber,
  formatDate,
  formatBranch,
  formatDivision,
} from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { getUserDisplayName, getUserBranch, getUserDivision } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPrinted: 0,
    todayPrinted: 0,
    thisWeekPrinted: 0,
    recentHistory: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const historyRes = await getPrintHistory({ limit: 5, page: 1 });

        if (historyRes.success) {
          const history = historyRes.data || [];
          const total = historyRes.pagination?.total || 0;

          const today = new Date().toISOString().split("T")[0];
          const todayCount = history.filter((item) =>
            item.ptc_date?.startsWith(today),
          ).length;

          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekCount = history.filter(
            (item) => new Date(item.ptc_date) >= weekAgo,
          ).length;

          setStats({
            totalPrinted: total,
            todayPrinted: todayCount,
            thisWeekPrinted: weekCount,
            recentHistory: history.slice(0, 5),
          });
        }
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
      title: "Total Printed",
      value: formatNumber(stats.totalPrinted),
      icon: Award,
      gradient: "from-blue-500 to-cyan-500",
      description: "All time",
    },
    {
      title: "This Week",
      value: formatNumber(stats.thisWeekPrinted),
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      description: "Last 7 days",
    },
    {
      title: "Today",
      value: formatNumber(stats.todayPrinted),
      icon: Printer,
      gradient: "from-purple-500 to-pink-500",
      description: formatDate(new Date(), DATE_FORMATS.DISPLAY),
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
          Welcome, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-secondary text-sm mt-1">
          Ready to print some certificates today?
        </p>
      </div>

      {/* Teacher Info Card */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h2 className="text-sm font-semibold text-primary mb-3">
          Your Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-secondary">Teacher Name</p>
              <p className="text-sm font-semibold text-primary mt-0.5">
                {getUserDisplayName()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-secondary">Branch</p>
              <p className="text-sm font-semibold text-primary mt-0.5">
                {formatBranch(getUserBranch() || "N/A")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-secondary">Division</p>
              <p className="text-sm font-semibold text-primary mt-0.5">
                {formatDivision(getUserDivision() || "N/A")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <p className="text-xs text-secondary mt-1">
                    {stat.description}
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

      {/* Recent Print History */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h2 className="text-sm font-semibold text-primary mb-3">
          Recent Print History
        </h2>
        {stats.recentHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 rounded-full mb-3">
              <History className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-secondary text-sm mb-1">No print history yet</p>
            <p className="text-xs text-secondary mb-3">
              Start printing certificates to see them here
            </p>
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate("/teacher/print")}
              icon={<Printer className="w-3 h-3" />}
            >
              Print Your First Certificate
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentHistory.map((item, index) => (
              <div
                key={index}
                className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-2 border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary">
                      {item.student_name || "N/A"}
                    </p>
                    <p className="text-xs text-secondary">
                      {item.module_name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">
                    {formatDate(item.ptc_date, DATE_FORMATS.DISPLAY)}
                  </p>
                  <p className="text-xs text-secondary">
                    {item.certificate_id || "N/A"}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-gray-200/30 dark:border-white/5">
              <Button
                variant="ghost"
                size="small"
                fullWidth
                onClick={() => navigate("/teacher/history")}
                icon={<History className="w-3 h-3" />}
                iconPosition="right"
              >
                View All History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
