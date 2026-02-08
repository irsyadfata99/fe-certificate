import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  History,
  User,
  MapPin,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Card from "@components/common/Card";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { getPrintHistory } from "@api/printedCertApi";
import {
  formatNumber,
  formatDate,
  formatBranch,
  formatDivision,
} from "@utils/formatters";

/**
 * Teacher Dashboard
 * Overview for teacher role with quick actions
 */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, getUserDisplayName, getUserBranch, getUserDivision } =
    useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrinted: 0,
    todayPrinted: 0,
    thisWeekPrinted: 0,
    recentHistory: [],
  });

  // =====================================================
  // FETCH DATA
  // =====================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // Fetch print history
        const historyRes = await getPrintHistory({ limit: 5, page: 1 });

        if (historyRes.success) {
          const history = historyRes.data || [];
          const total = historyRes.pagination?.total || 0;

          // Calculate today's count
          const today = new Date().toISOString().split("T")[0];
          const todayCount = history.filter((item) =>
            item.ptc_date?.startsWith(today),
          ).length;

          // Calculate this week's count (simplified)
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
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  const quickActions = [
    {
      label: "Print Certificate",
      description: "Print a new certificate for student",
      icon: Printer,
      path: "/teacher/print",
      variant: "primary",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    },
    {
      label: "View History",
      description: "See your printing history",
      icon: History,
      path: "/teacher/history",
      variant: "outline",
      color:
        "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    },
  ];

  // =====================================================
  // STATS CARDS
  // =====================================================

  const statsCards = [
    {
      title: "Total Printed",
      value: formatNumber(stats.totalPrinted),
      icon: Award,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "All time",
    },
    {
      title: "This Week",
      value: formatNumber(stats.thisWeekPrinted),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Last 7 days",
    },
    {
      title: "Today",
      value: formatNumber(stats.todayPrinted),
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: formatDate(new Date(), "dd MMM yyyy"),
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
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Welcome, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-secondary mt-1">
          Ready to print some certificates today?
        </p>
      </div>

      {/* Teacher Info Card */}
      <Card title="Your Information" padding="default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Name */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-secondary">Teacher Name</p>
              <p className="text-base font-semibold text-primary mt-1">
                {getUserDisplayName()}
              </p>
            </div>
          </div>

          {/* Branch */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-secondary">Branch</p>
              <p className="text-base font-semibold text-primary mt-1">
                {formatBranch(getUserBranch() || "N/A")}
              </p>
            </div>
          </div>

          {/* Division */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-secondary">Division</p>
              <p className="text-base font-semibold text-primary mt-1">
                {formatDivision(getUserDivision() || "N/A")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} padding="default" hoverable>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-secondary mt-2">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Recent Print History */}
      <Card title="Recent Print History" padding="default">
        {stats.recentHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface border border-secondary/20 rounded-full mb-4">
              <History className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-secondary text-lg mb-2">No print history yet</p>
            <p className="text-sm text-secondary mb-4">
              Start printing certificates to see them here
            </p>
            <Button
              variant="primary"
              size="medium"
              onClick={() => navigate("/teacher/print")}
              icon={<Printer className="w-4 h-4" />}
            >
              Print Your First Certificate
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-surface border border-secondary/10 rounded-lg hover:border-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">
                      {item.student_name || "N/A"}
                    </p>
                    <p className="text-sm text-secondary">
                      {item.module_name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary">
                    {formatDate(item.ptc_date, "dd MMM yyyy")}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    {item.certificate_id || "N/A"}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-secondary/10">
              <Button
                variant="ghost"
                size="medium"
                fullWidth
                onClick={() => navigate("/teacher/history")}
                icon={<History className="w-4 h-4" />}
                iconPosition="right"
              >
                View All History
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherDashboard;
