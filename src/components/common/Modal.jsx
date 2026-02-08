import { useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";

/**
 * Modal Component
 * Overlay modal dengan backdrop dan smooth animations
 *
 * Features:
 * - Backdrop with blur
 * - ESC key to close
 * - Click outside to close
 * - Different sizes
 * - Header, body, footer sections
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = "",
}) => {
  // =====================================================
  // SIZE VARIANTS
  // =====================================================

  const sizeVariants = {
    small: "max-w-md",
    medium: "max-w-lg",
    large: "max-w-2xl",
    xlarge: "max-w-4xl",
    full: "max-w-7xl",
  };

  // =====================================================
  // HANDLE ESC KEY
  // =====================================================

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // =====================================================
  // PREVENT BODY SCROLL WHEN MODAL OPEN
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // =====================================================
  // HANDLE BACKDROP CLICK
  // =====================================================

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // =====================================================
  // DON'T RENDER IF NOT OPEN
  // =====================================================

  if (!isOpen) return null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        className={`
          relative
          w-full
          ${sizeVariants[size]}
          bg-surface
          rounded-lg
          shadow-2xl
          max-h-[90vh]
          overflow-hidden
          flex flex-col
          animate-slideIn
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary/10">
          {/* Title */}
          <h2 className="text-xl font-semibold text-primary">{title}</h2>

          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-primary">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-secondary/10 bg-surface/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// PROP TYPES
// =====================================================

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["small", "medium", "large", "xlarge", "full"]),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  className: PropTypes.string,
};

export default Modal;
