import { useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@hooks/useAuth";
import { ENV } from "@config/env";

/**
 * Navbar Component
 * Top navigation dengan user menu dan theme toggle
 *
 * Features:
 * - App title
 * - User info & avatar
 * - Logout button
 * - Theme toggle
 * - Mobile menu toggle
 * - Responsive
 */
const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout, getUserDisplayName, getUserRoleLabel } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // =====================================================
  // HANDLE LOGOUT
  // =====================================================

  const handleLogout = () => {
    logout();
  };

  // =====================================================
  // HANDLE PROFILE
  // =====================================================

  const handleProfile = () => {
    navigate("/profile");
    setShowUserMenu(false);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <nav className="bg-surface border-b border-secondary/20 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Menu Button + Title */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* App Title */}
            <h1 className="text-xl font-bold text-primary">{ENV.APP_NAME}</h1>
          </div>

          {/* Right Section: Theme Toggle + User Menu */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {user && (
              <div className="relative">
                {/* User Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>

                  {/* User Info (Hidden on mobile) */}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-primary">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-secondary">
                      {getUserRoleLabel()}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-secondary/20 rounded-lg shadow-lg z-20 overflow-hidden">
                      {/* Profile Button */}
                      <button
                        onClick={handleProfile}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-primary hover:bg-primary/10 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">Profile</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-secondary/10" />

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-status-error hover:bg-status-error/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
