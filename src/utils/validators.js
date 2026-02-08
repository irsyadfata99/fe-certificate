/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object}
 */
export const validatePassword = (password) => {
  const minLength = 8;

  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters`,
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate required field
 * @param {any} value
 * @param {string} fieldName
 * @returns {Object}
 */
export const validateRequired = (value, fieldName = "This field") => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: "" };
};

/**
 * Validate number range
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName
 * @returns {Object}
 */
export const validateNumberRange = (value, min, max, fieldName = "Value") => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }

  if (num < min || num > max) {
    return {
      valid: false,
      message: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return { valid: true, message: "" };
};
