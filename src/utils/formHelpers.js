/**
 * Convert validation result to react-hook-form format
 */
export const toFormValidation = (validationFn) => {
  return (value) => {
    const result = validationFn(value);
    return result.valid || result.message;
  };
};

/**
 * Create validation rules for react-hook-form
 */
export const createValidationRules = (rules) => {
  const formRules = {};

  if (rules.required) {
    formRules.required =
      rules.required === true ? "This field is required" : rules.required;
  }

  if (rules.minLength) {
    formRules.minLength = {
      value: rules.minLength,
      message: `Minimum length is ${rules.minLength} characters`,
    };
  }

  if (rules.maxLength) {
    formRules.maxLength = {
      value: rules.maxLength,
      message: `Maximum length is ${rules.maxLength} characters`,
    };
  }

  if (rules.min) {
    formRules.min = {
      value: rules.min,
      message: `Minimum value is ${rules.min}`,
    };
  }

  if (rules.max) {
    formRules.max = {
      value: rules.max,
      message: `Maximum value is ${rules.max}`,
    };
  }

  if (rules.pattern) {
    formRules.pattern = {
      value: rules.pattern,
      message: rules.patternMessage || "Invalid format",
    };
  }

  if (rules.validate) {
    formRules.validate = rules.validate;
  }

  return formRules;
};

/**
 * Extract error messages from react-hook-form errors
 */
export const getFormErrorMessage = (errors, field) => {
  return errors[field]?.message || "";
};

/**
 * Check if form has errors
 */
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
