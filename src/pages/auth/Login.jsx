import { useState } from "react";
import { Eye, EyeOff, LogIn, User, Lock } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import ThemeToggle from "@components/common/ThemeToggle";
import { ENV } from "@config/env";

/**
 * Login Page
 * Handles user authentication for both Admin and Teacher roles
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
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-surface rounded-lg shadow-lg p-8 border border-secondary/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {ENV.APP_NAME}
              </h1>
              <p className="text-secondary text-sm mt-1">
                Certificate Management System
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-primary mb-2">
              Welcome Back
            </h2>
            <p className="text-secondary text-sm">Please sign in to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              error={errors.username}
              disabled={isSubmitting}
              required
              prefixIcon={<User className="w-5 h-5" />}
              autoComplete="username"
              autoFocus
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                error={errors.password}
                disabled={isSubmitting}
                required
                prefixIcon={<Lock className="w-5 h-5" />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="p-1 hover:bg-primary/10 rounded transition-colors"
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                autoComplete="current-password"
              />
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

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-secondary/10">
            <div className="space-y-2 text-sm text-secondary">
              <p className="font-medium">Test Accounts:</p>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-medium text-primary">Admin:</span> admin
                  / admin123
                </p>
                <p>
                  <span className="font-medium text-primary">Teacher:</span>{" "}
                  teacher1 / password123
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center mt-4">
          <p className="text-xs text-secondary">
            Version {ENV.APP_VERSION} · {ENV.MODE}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
