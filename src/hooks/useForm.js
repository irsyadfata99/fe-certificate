import { useState, useCallback, useRef } from "react";
import { ENV } from "@config/env";

/**
 * useForm Hook
 * Manage form state, validation, and submission
 *
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Form options
 * @returns {Object} Form state and methods
 */
export const useForm = (initialValues = {}, options = {}) => {
  const {
    validationSchema = null,
    validateOnChange = false,
    validateOnBlur = true,
    onSubmit = null,
  } = options;

  // =====================================================
  // STATE
  // =====================================================

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Track initial values for reset
  const initialValuesRef = useRef(initialValues);

  // =====================================================
  // VALIDATION
  // =====================================================

  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {any} value - Field value
   * @returns {string|null} Error message or null
   */
  const validateField = useCallback(
    (name, value) => {
      if (!validationSchema || !validationSchema[name]) {
        return null;
      }

      const fieldSchema = validationSchema[name];

      // Required validation
      if (fieldSchema.required) {
        if (value === null || value === undefined || value === "") {
          return fieldSchema.requiredMessage || `${name} is required`;
        }
      }

      // Min length validation
      if (fieldSchema.minLength && typeof value === "string") {
        if (value.length < fieldSchema.minLength) {
          return (
            fieldSchema.minLengthMessage ||
            `${name} must be at least ${fieldSchema.minLength} characters`
          );
        }
      }

      // Max length validation
      if (fieldSchema.maxLength && typeof value === "string") {
        if (value.length > fieldSchema.maxLength) {
          return (
            fieldSchema.maxLengthMessage ||
            `${name} must be at most ${fieldSchema.maxLength} characters`
          );
        }
      }

      // Min value validation
      if (fieldSchema.min !== undefined && typeof value === "number") {
        if (value < fieldSchema.min) {
          return (
            fieldSchema.minMessage ||
            `${name} must be at least ${fieldSchema.min}`
          );
        }
      }

      // Max value validation
      if (fieldSchema.max !== undefined && typeof value === "number") {
        if (value > fieldSchema.max) {
          return (
            fieldSchema.maxMessage ||
            `${name} must be at most ${fieldSchema.max}`
          );
        }
      }

      // Pattern validation
      if (fieldSchema.pattern && typeof value === "string") {
        if (!fieldSchema.pattern.test(value)) {
          return fieldSchema.patternMessage || `${name} format is invalid`;
        }
      }

      // Custom validation function
      if (fieldSchema.validate && typeof fieldSchema.validate === "function") {
        const customError = fieldSchema.validate(value, values);
        if (customError) {
          return customError;
        }
      }

      return null;
    },
    [validationSchema, values],
  );

  /**
   * Validate all fields
   * @returns {Object} Errors object
   */
  const validateForm = useCallback(() => {
    if (!validationSchema) return {};

    const newErrors = {};

    Object.keys(validationSchema).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [validationSchema, values, validateField]);

  // =====================================================
  // FIELD HANDLERS
  // =====================================================

  /**
   * Handle field change
   * @param {Event|Object} e - Event or { name, value } object
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target || e;
      const fieldValue = type === "checkbox" ? checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Validate on change if enabled
      if (validateOnChange) {
        const error = validateField(name, fieldValue);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      } else if (errors[name]) {
        // Clear error when user starts typing
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [validateOnChange, validateField, errors],
  );

  /**
   * Handle field blur
   * @param {Event|Object} e - Event or { name } object
   */
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target || e;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate on blur if enabled
      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnBlur, validateField, values],
  );

  /**
   * Set field value programmatically
   * @param {string} name - Field name
   * @param {any} value - Field value
   * @param {boolean} shouldValidate - Whether to validate
   */
  const setFieldValue = useCallback(
    (name, value, shouldValidate = true) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (shouldValidate && validationSchema) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateField, validationSchema],
  );

  /**
   * Set field error programmatically
   * @param {string} name - Field name
   * @param {string} error - Error message
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Set field touched programmatically
   * @param {string} name - Field name
   * @param {boolean} isTouched - Touched state
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  /**
   * Set multiple values at once
   * @param {Object} newValues - New values object
   */
  const setFormValues = useCallback((newValues) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  /**
   * Set multiple errors at once
   * @param {Object} newErrors - New errors object
   */
  const setFormErrors = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  // =====================================================
  // FORM SUBMISSION
  // =====================================================

  /**
   * Handle form submit
   * @param {Event} e - Submit event
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      setSubmitCount((prev) => prev + 1);

      // Validate form
      const validationErrors = validateForm();

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);

        // Mark all fields as touched
        const allTouched = {};
        Object.keys(values).forEach((key) => {
          allTouched[key] = true;
        });
        setTouched(allTouched);

        ENV.ENABLE_LOGGING &&
          console.warn("⚠️ Form validation failed:", validationErrors);
        return;
      }

      // Clear errors
      setErrors({});

      // Submit form
      if (onSubmit && typeof onSubmit === "function") {
        setIsSubmitting(true);

        try {
          await onSubmit(values);
          ENV.ENABLE_LOGGING && console.log("✅ Form submitted successfully");
        } catch (error) {
          ENV.ENABLE_LOGGING &&
            console.error("❌ Form submission error:", error);
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit],
  );

  // =====================================================
  // FORM RESET
  // =====================================================

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, []);

  /**
   * Reset form to new values
   * @param {Object} newValues - New initial values
   */
  const resetFormWithValues = useCallback((newValues) => {
    initialValuesRef.current = newValues;
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, []);

  // =====================================================
  // UTILITIES
  // =====================================================

  /**
   * Check if field has error
   * @param {string} name - Field name
   * @returns {boolean}
   */
  const hasError = useCallback(
    (name) => {
      return Boolean(errors[name] && touched[name]);
    },
    [errors, touched],
  );

  /**
   * Get field error message
   * @param {string} name - Field name
   * @returns {string|null}
   */
  const getError = useCallback(
    (name) => {
      return touched[name] ? errors[name] || null : null;
    },
    [errors, touched],
  );

  /**
   * Check if form is valid
   * @returns {boolean}
   */
  const isValid = useCallback(() => {
    return Object.keys(validateForm()).length === 0;
  }, [validateForm]);

  /**
   * Check if form has been modified
   * @returns {boolean}
   */
  const isDirty = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  /**
   * Get field props for input binding
   * @param {string} name - Field name
   * @returns {Object} Field props
   */
  const getFieldProps = useCallback(
    (name) => {
      return {
        name,
        value: values[name] ?? "",
        onChange: handleChange,
        onBlur: handleBlur,
        error: getError(name),
        hasError: hasError(name),
      };
    },
    [values, handleChange, handleBlur, getError, hasError],
  );

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    // Values
    values,
    errors,
    touched,

    // State
    isSubmitting,
    submitCount,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Setters
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setFormValues,
    setFormErrors,

    // Reset
    resetForm,
    resetFormWithValues,

    // Validation
    validateField,
    validateForm,

    // Utilities
    hasError,
    getError,
    isValid,
    isDirty,
    getFieldProps,
  };
};

export default useForm;
