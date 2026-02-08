import PropTypes from "prop-types";

/**
 * Spinner Component
 * Loading indicator with configurable size and color
 */
const Spinner = ({ size = "medium", color = "blue" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const colorClasses = {
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600",
    primary: "border-primary",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

// =====================================================
// PROP TYPES
// =====================================================

Spinner.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  color: PropTypes.oneOf(["blue", "white", "gray", "primary"]),
};

export default Spinner;
