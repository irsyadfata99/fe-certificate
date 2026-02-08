import { forwardRef } from "react";
import PropTypes from "prop-types";

/**
 * Input Component
 * Reusable input dengan validation states sesuai theme
 *
 * Features:
 * - Label & helper text
 * - Error & success states
 * - Prefix & suffix icons
 * - Disabled state
 * - Different input types
 */
const Input = forwardRef(
  (
    {
      label,
      type = "text",
      name,
      value,
      placeholder,
      error,
      helperText,
      success,
      disabled = false,
      required = false,
      fullWidth = true,
      className = "",
      prefixIcon = null,
      suffixIcon = null,
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    // =====================================================
    // STATE STYLES
    // =====================================================

    const getInputStateStyles = () => {
      if (error) {
        return "border-status-error focus:ring-status-error";
      }
      if (success) {
        return "border-status-success focus:ring-status-success";
      }
      return "border-secondary focus:ring-primary";
    };

    // =====================================================
    // BASE STYLES
    // =====================================================

    const baseStyles = `
      bg-surface
      text-primary
      border
      rounded-lg
      px-4 py-2.5
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      placeholder:text-secondary
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    // =====================================================
    // WIDTH STYLES
    // =====================================================

    const widthStyles = fullWidth ? "w-full" : "";

    // =====================================================
    // PADDING ADJUSTMENTS FOR ICONS
    // =====================================================

    const iconPadding = prefixIcon ? "pl-10" : suffixIcon ? "pr-10" : "";

    // =====================================================
    // RENDER
    // =====================================================

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-primary mb-1.5"
          >
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Prefix Icon */}
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
              {prefixIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            name={name}
            id={name}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            className={`
              ${baseStyles}
              ${getInputStateStyles()}
              ${widthStyles}
              ${iconPadding}
            `}
            {...props}
          />

          {/* Suffix Icon */}
          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
              {suffixIcon}
            </div>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <p
            className={`mt-1.5 text-sm ${
              error
                ? "text-status-error"
                : success
                  ? "text-status-success"
                  : "text-secondary"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// =====================================================
// PROP TYPES
// =====================================================

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  prefixIcon: PropTypes.node,
  suffixIcon: PropTypes.node,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
};

export default Input;
