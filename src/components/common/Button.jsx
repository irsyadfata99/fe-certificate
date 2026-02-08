import PropTypes from "prop-types";

/**
 * Button Component
 * Reusable button dengan variants sesuai theme
 *
 * Variants:
 * - primary: Cornflower Blue (#6495ED)
 * - secondary: Vivid Magenta (#FF00FF)
 * - outline: Transparent dengan border
 * - success: Green
 * - warning: Yellow
 * - danger: Red
 * - ghost: Transparent tanpa border
 */
const Button = ({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  loading = false,
  type = "button",
  onClick,
  className = "",
  icon = null,
  iconPosition = "left",
  ...props
}) => {
  // =====================================================
  // VARIANT STYLES
  // =====================================================

  const variantStyles = {
    primary:
      "bg-primary text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-secondary text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
    outline:
      "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white active:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
    success:
      "bg-status-success text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
    warning:
      "bg-status-warning text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
    danger:
      "bg-status-error text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  // =====================================================
  // SIZE STYLES
  // =====================================================

  const sizeStyles = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  // =====================================================
  // BASE STYLES
  // =====================================================

  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

  // =====================================================
  // WIDTH STYLES
  // =====================================================

  const widthStyles = fullWidth ? "w-full" : "";

  // =====================================================
  // LOADING SPINNER
  // =====================================================

  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && <LoadingSpinner />}

      {/* Icon Left */}
      {icon && iconPosition === "left" && !loading && (
        <span className="flex items-center">{icon}</span>
      )}

      {/* Children */}
      {children}

      {/* Icon Right */}
      {icon && iconPosition === "right" && !loading && (
        <span className="flex items-center">{icon}</span>
      )}
    </button>
  );
};

// =====================================================
// PROP TYPES
// =====================================================

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "outline",
    "success",
    "warning",
    "danger",
    "ghost",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  onClick: PropTypes.func,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
};

export default Button;
