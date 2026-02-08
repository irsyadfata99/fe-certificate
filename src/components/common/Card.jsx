import PropTypes from "prop-types";

/**
 * Card Component
 * Container dengan surface background sesuai theme
 *
 * Features:
 * - Header, body, footer sections
 * - Hover effect (optional)
 * - Padding variants
 * - Border variants
 */
const Card = ({
  children,
  header = null,
  footer = null,
  title = null,
  subtitle = null,
  hoverable = false,
  noPadding = false,
  padding = "default",
  border = true,
  shadow = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  onClick,
}) => {
  // =====================================================
  // PADDING VARIANTS
  // =====================================================

  const paddingVariants = {
    none: "",
    small: "p-3",
    default: "p-6",
    large: "p-8",
  };

  const bodyPadding = noPadding ? "" : paddingVariants[padding];

  // =====================================================
  // BASE STYLES
  // =====================================================

  const baseStyles = `
    bg-surface
    rounded-lg
    transition-all duration-200
  `;

  const borderStyles = border ? "border border-secondary/20" : "";
  const shadowStyles = shadow ? "shadow-sm" : "";
  const hoverStyles = hoverable
    ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    : "";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className={`
        ${baseStyles}
        ${borderStyles}
        ${shadowStyles}
        ${hoverStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header Section */}
      {(header || title) && (
        <div
          className={`
            border-b border-secondary/10
            ${paddingVariants[padding]}
            ${headerClassName}
          `}
        >
          {header || (
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-primary">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-secondary mt-1">{subtitle}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Body Section */}
      <div className={`${bodyPadding} ${bodyClassName}`}>{children}</div>

      {/* Footer Section */}
      {footer && (
        <div
          className={`
            border-t border-secondary/10
            ${paddingVariants[padding]}
            ${footerClassName}
          `}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

// =====================================================
// PROP TYPES
// =====================================================

Card.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  hoverable: PropTypes.bool,
  noPadding: PropTypes.bool,
  padding: PropTypes.oneOf(["none", "small", "default", "large"]),
  border: PropTypes.bool,
  shadow: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  onClick: PropTypes.func,
};

export default Card;
