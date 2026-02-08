import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  BookOpen,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Card from "@components/common/Card";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import { getCertificates, getStockSummary } from "@api/certificateApi";
import { getTeachers } from "@api/teacherApi";
import { getModules } from "@api/moduleApi";
import { formatNumber, formatDate } from "@utils/formatters";

/**
 * Admin Dashboard
 * Overview of system statistics and quick actions
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, getUserDisplayName } = useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalTeachers: 0,
    totalModules: 0,
    stockSummary: null,
  });

  // =====================================================
  // FETCH DATA
  // =====================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // Fetch all required data in parallel
        const [certificatesRes, teachersRes, modulesRes, stockRes] =
          await Promise.allSettled([
            getCertificates({ limit: 1 }), // Just get count
            getTeachers({ limit: 1 }), // Just get count
            getModules({ limit: 1 }), // Just get count
            getStockSummary(),
          ]);

        // Update stats
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
          stockSummary:
            stockRes.status === "fulfilled"
              ? stockRes.value?.data || null
              : null,
        });
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
      label: "Manage Certificates",
      icon: FileText,
      path: "/admin/certificates",
      variant: "primary",
    },
    {
      label: "Manage Teachers",
      icon: Users,
      path: "/admin/teachers",
      variant: "secondary",
    },
    {
      label: "Manage Modules",
      icon: BookOpen,
      path: "/admin/modules",
      variant: "outline",
    },
    {
      label: "View Logs",
      icon: Activity,
      path: "/admin/logs",
      variant: "ghost",
    },
  ];

  // =====================================================
  // STATS CARDS
  // =====================================================

  const statsCards = [
    {
      title: "Total Certificates",
      value: formatNumber(stats.totalCertificates),
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: "+12%",
    },
    {
      title: "Total Teachers",
      value: formatNumber(stats.totalTeachers),
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      trend: "+5%",
    },
    {
      title: "Total Modules",
      value: formatNumber(stats.totalModules),
      icon: BookOpen,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      trend: "+8%",
    },
    {
      title: "Active Branches",
      value: "3",
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      trend: "SND, MKW, KBP",
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
          Welcome back, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-secondary mt-1">
          Here's what's happening with your system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-xs text-secondary mt-2">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stock Summary */}
      {stats.stockSummary && (
        <Card title="Stock Summary by Branch" padding="default">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.stockSummary).map(([branch, stock]) => (
              <div
                key={branch}
                className="p-4 bg-surface border border-secondary/10 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary">{branch}</h3>
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(stock)}
                </p>
                <p className="text-xs text-secondary mt-1">
                  Available certificates
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card title="Recent Activity" padding="default">
        <div className="space-y-4">
          {/* Sample activity items - replace with real data */}
          <div className="flex items-start gap-4 p-3 bg-surface border border-secondary/10 rounded-lg">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">
                New certificate batch added
              </p>
              <p className="text-xs text-secondary mt-1">
                50 certificates added to SND branch
              </p>
            </div>
            <p className="text-xs text-secondary">
              {formatDate(new Date(), "dd MMM HH:mm")}
            </p>
          </div>

          <div className="flex items-start gap-4 p-3 bg-surface border border-secondary/10 rounded-lg">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">
                New teacher registered
              </p>
              <p className="text-xs text-secondary mt-1">
                Teacher added to MKW branch
              </p>
            </div>
            <p className="text-xs text-secondary">
              {formatDate(new Date(), "dd MMM HH:mm")}
            </p>
          </div>

          <div className="flex items-start gap-4 p-3 bg-surface border border-secondary/10 rounded-lg">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Module updated</p>
              <p className="text-xs text-secondary mt-1">
                Age range modified for JK-001
              </p>
            </div>
            <p className="text-xs text-secondary">
              {formatDate(new Date(), "dd MMM HH:mm")}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-secondary/10">
          <Button
            variant="ghost"
            size="medium"
            onClick={() => navigate("/admin/logs")}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            View All Activity
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
