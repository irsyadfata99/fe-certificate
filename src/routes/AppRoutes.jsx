import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import Spinner from "../components/common/Spinner";

// Lazy load pages for code splitting
const Login = lazy(() => import("../pages/auth/Login"));
const Profile = lazy(() => import("../pages/auth/Profile"));

// Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const Branches = lazy(() => import("../pages/admin/Branches")); // ← TAMBAHKAN INI
const Certificates = lazy(() => import("../pages/admin/Certificates"));
const Teachers = lazy(() => import("../pages/admin/Teachers"));
const Modules = lazy(() => import("../pages/admin/Modules"));
const Logs = lazy(() => import("../pages/admin/Logs"));

// Teacher pages
const TeacherDashboard = lazy(
  () => import("../pages/teacher/TeacherDashboard"),
);
const PrintCertificate = lazy(
  () => import("../pages/teacher/PrintCertificate"),
);
const HistoryPrint = lazy(() => import("../pages/teacher/HistoryPrint"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="large" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - All authenticated users */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/branches" element={<Branches />} />
          <Route path="/admin/certificates" element={<Certificates />} />
          <Route path="/admin/teachers" element={<Teachers />} />
          <Route path="/admin/modules" element={<Modules />} />
          <Route path="/admin/logs" element={<Logs />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<PrivateRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/print-certificate" element={<PrintCertificate />} />
          <Route path="/teacher/history" element={<HistoryPrint />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
