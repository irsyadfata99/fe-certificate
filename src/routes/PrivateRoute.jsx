import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/layout/Layout";

/**
 * PrivateRoute - Protects routes that require authentication
 * @param {Array} allowedRoles - Optional array of allowed roles
 */
const PrivateRoute = ({ allowedRoles = null }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    const redirectPath =
      user?.role === "admin" ? "/admin/dashboard" : "/teacher/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Authenticated and authorized
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoute;
