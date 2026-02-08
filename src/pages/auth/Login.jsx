import { useState } from "react";
import { Eye, EyeOff, LogIn, User, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import ThemeToggle from "@components/common/ThemeToggle";
import { ENV } from "@config/env";

/**
 * Login Page - Redesigned with Glassmorphism
 * Matches dashboard design language
 */
const Login = () => {
  const { login } = useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =====================================================
  // HANDLERS
  // =====================================================

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Set submitting state to lock form
    setIsSubmitting(true);

    try {
      // Call login from useAuth hook
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });

      // Keep loading state - navigation will happen in useAuth
      // Don't set isSubmitting to false here
    } catch (error) {
      // Only unlock form on error
      setIsSubmitting(false);
      // Error toast handled by API error handler
      console.error("Login failed:", error);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradients - matching dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card - Glassmorphism Style */}
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-8 border border-gray-200/50 dark:border-white/10 shadow-2xl">
          {/* Header with Theme Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">CMS</h1>
                <p className="text-xs text-secondary">
                  Certificate Management System
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">
              Welcome Back! 👋
            </h2>
            <p className="text-secondary text-sm">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-primary mb-1.5"
              >
                Username <span className="text-status-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                  required
                  autoComplete="username"
                  autoFocus
                  className={`
                    w-full
                    bg-surface
                    text-primary
                    border
                    ${errors.username ? "border-status-error" : "border-secondary"}
                    rounded-lg
                    pl-10 pr-4 py-2.5
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${errors.username ? "focus:ring-status-error" : "focus:ring-primary"}
                    placeholder:text-secondary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-sm text-status-error">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary mb-1.5"
              >
                Password <span className="text-status-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  required
                  autoComplete="current-password"
                  className={`
                    w-full
                    bg-surface
                    text-primary
                    border
                    ${errors.password ? "border-status-error" : "border-secondary"}
                    rounded-lg
                    pl-10 pr-12 py-2.5
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${errors.password ? "focus:ring-status-error" : "focus:ring-primary"}
                    placeholder:text-secondary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded transition-colors text-secondary"
                  tabIndex={-1}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-status-error">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<LogIn className="w-5 h-5" />}
              className="mt-6"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-secondary">
            Version {ENV.APP_VERSION} • {ENV.MODE}
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-3 backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-3 border border-gray-200/30 dark:border-white/5">
          <p className="text-xs text-secondary text-center">
            🔒 Your credentials are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
