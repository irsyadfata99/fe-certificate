import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/layout/Layout";

/**
 * AdminRoute - Protects admin-only routes
 */
const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Not admin - redirect to teacher dashboard
  if (user?.role !== "admin") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Admin authenticated
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default AdminRoute;
