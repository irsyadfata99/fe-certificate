import { NavLink } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  History,
  Printer,
  Activity,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";

/**
 * Sidebar Component
 * Side navigation menu dengan role-based menu items
 *
 * Features:
 * - Different menus for Admin & Teacher
 * - Active state indication
 * - Mobile responsive
 * - Smooth transitions
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  // =====================================================
  // MENU ITEMS
  // =====================================================

  const adminMenuItems = [
    {
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/admin/certificates",
      icon: FileText,
      label: "Certificates",
    },
    {
      path: "/admin/teachers",
      icon: Users,
      label: "Teachers",
    },
    {
      path: "/admin/modules",
      icon: BookOpen,
      label: "Modules",
    },
    {
      path: "/admin/logs",
      icon: Activity,
      label: "Logs",
    },
  ];

  const teacherMenuItems = [
    {
      path: "/teacher/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/teacher/print",
      icon: Printer,
      label: "Print Certificate",
    },
    {
      path: "/teacher/history",
      icon: History,
      label: "Print History",
    },
  ];

  const menuItems = isAdmin() ? adminMenuItems : teacherMenuItems;

  // =====================================================
  // RENDER MENU ITEM
  // =====================================================

  const MenuItem = ({ item }) => (
    <NavLink
      to={item.path}
      onClick={() => onClose && onClose()}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-200
        ${
          isActive
            ? "bg-primary text-white shadow-md"
            : "text-primary hover:bg-primary/10"
        }
      `}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-64
          bg-surface border-r border-secondary/20
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-secondary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-semibold text-primary">Menu</span>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer - User Info */}
        {user && (
          <div className="px-4 py-3 border-t border-secondary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user.teacherName?.charAt(0).toUpperCase() ||
                    user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {user.teacherName || user.username}
                </p>
                <p className="text-xs text-secondary">
                  {user.role === "admin" ? "Administrator" : user.teacherBranch}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
