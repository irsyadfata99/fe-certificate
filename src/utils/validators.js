/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
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
 */
export const validateRequired = (value, fieldName = "This field") => {
  if (value === null || value === undefined) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (typeof value === "string" && !value.trim()) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, message: `${fieldName} is required` };
  }

  return { valid: true, message: "" };
};

/**
 * Validate number range
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

/**
 * Validate positive integer
 */
export const validatePositiveInteger = (value, fieldName = "Value") => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, message: `${fieldName} must be an integer` };
  }

  if (num < 0) {
    return { valid: false, message: `${fieldName} cannot be negative` };
  }

  return { valid: true, message: "" };
};

/**
 * Validate certificate ID format
 */
export const validateCertificateId = (certificateId) => {
  if (!certificateId || !certificateId.trim()) {
    return { valid: false, message: "Certificate ID is required" };
  }

  const cleanId = certificateId.trim();

  if (cleanId.length < 3) {
    return {
      valid: false,
      message: "Certificate ID must be at least 3 characters",
    };
  }

  if (cleanId.length > 50) {
    return {
      valid: false,
      message: "Certificate ID must not exceed 50 characters",
    };
  }

  const validPattern = /^[A-Za-z0-9_-]+$/;
  if (!validPattern.test(cleanId)) {
    return {
      valid: false,
      message:
        "Certificate ID can only contain letters, numbers, dashes, and underscores",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate username format
 */
export const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return { valid: false, message: "Username is required" };
  }

  const cleanUsername = username.trim();

  if (cleanUsername.length < 3) {
    return {
      valid: false,
      message: "Username must be at least 3 characters",
    };
  }

  if (cleanUsername.length > 50) {
    return {
      valid: false,
      message: "Username must not exceed 50 characters",
    };
  }

  const validPattern = /^[a-z0-9_]+$/;
  if (!validPattern.test(cleanUsername)) {
    return {
      valid: false,
      message:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate teacher name
 */
export const validateTeacherName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, message: "Teacher name is required" };
  }

  const cleanName = name.trim();

  if (cleanName.length < 3) {
    return {
      valid: false,
      message: "Teacher name must be at least 3 characters",
    };
  }

  if (cleanName.length > 100) {
    return {
      valid: false,
      message: "Teacher name must not exceed 100 characters",
    };
  }

  return { valid: true, message: "" };
};

// =====================================================
// NEW: ARRAY VALIDATORS FOR MULTI-BRANCH/DIVISION
// =====================================================

/**
 * Validate branches array
 * @param {Array} branches - Array of branch codes ["SND", "MKW"]
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateBranchesArray = (branches, options = {}) => {
  const {
    required = true,
    minCount = 1,
    maxCount = 10,
    validBranches = null,
  } = options;

  // Check if required
  if (
    required &&
    (!branches || !Array.isArray(branches) || branches.length === 0)
  ) {
    return {
      valid: false,
      message: "At least one branch must be selected",
    };
  }

  // If not required and empty, that's OK
  if (!required && (!branches || branches.length === 0)) {
    return { valid: true, message: "" };
  }

  // Check minimum count
  if (branches.length < minCount) {
    return {
      valid: false,
      message: `At least ${minCount} branch${minCount !== 1 ? "es" : ""} must be selected`,
    };
  }

  // Check maximum count
  if (branches.length > maxCount) {
    return {
      valid: false,
      message: `Maximum ${maxCount} branch${maxCount !== 1 ? "es" : ""} allowed`,
    };
  }

  // Validate each branch code
  if (validBranches) {
    const invalidBranches = branches.filter((b) => !validBranches.includes(b));
    if (invalidBranches.length > 0) {
      return {
        valid: false,
        message: `Invalid branch codes: ${invalidBranches.join(", ")}`,
      };
    }
  }

  // Check for duplicates
  const uniqueBranches = new Set(branches);
  if (uniqueBranches.size !== branches.length) {
    return {
      valid: false,
      message: "Duplicate branches are not allowed",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate divisions array
 * @param {Array} divisions - Array of division codes ["JK", "LK"]
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateDivisionsArray = (divisions, options = {}) => {
  const {
    required = true,
    minCount = 1,
    maxCount = 2,
    validDivisions = ["JK", "LK"],
  } = options;

  // Check if required
  if (
    required &&
    (!divisions || !Array.isArray(divisions) || divisions.length === 0)
  ) {
    return {
      valid: false,
      message: "At least one division must be selected",
    };
  }

  // If not required and empty, that's OK
  if (!required && (!divisions || divisions.length === 0)) {
    return { valid: true, message: "" };
  }

  // Check minimum count
  if (divisions.length < minCount) {
    return {
      valid: false,
      message: `At least ${minCount} division${minCount !== 1 ? "s" : ""} must be selected`,
    };
  }

  // Check maximum count
  if (divisions.length > maxCount) {
    return {
      valid: false,
      message: `Maximum ${maxCount} division${maxCount !== 1 ? "s" : ""} allowed`,
    };
  }

  // Validate each division code
  const invalidDivisions = divisions.filter((d) => !validDivisions.includes(d));
  if (invalidDivisions.length > 0) {
    return {
      valid: false,
      message: `Invalid division codes: ${invalidDivisions.join(", ")}`,
    };
  }

  // Check for duplicates
  const uniqueDivisions = new Set(divisions);
  if (uniqueDivisions.size !== divisions.length) {
    return {
      valid: false,
      message: "Duplicate divisions are not allowed",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate teacher form data (complete)
 * @param {Object} data - Teacher form data
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {Object} Validation result with all errors
 */
export const validateTeacherForm = (data, isEdit = false) => {
  const errors = {};

  // Username
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.message;
  }

  // Teacher name
  const nameValidation = validateTeacherName(data.teacher_name);
  if (!nameValidation.valid) {
    errors.teacher_name = nameValidation.message;
  }

  // Branches array
  const branchesValidation = validateBranchesArray(data.branches);
  if (!branchesValidation.valid) {
    errors.branches = branchesValidation.message;
  }

  // Divisions array
  const divisionsValidation = validateDivisionsArray(data.divisions);
  if (!divisionsValidation.valid) {
    errors.divisions = divisionsValidation.message;
  }

  // Password (only for edit if provided)
  if (isEdit && data.new_password && data.new_password.trim()) {
    const passwordValidation = validatePassword(data.new_password);
    if (!passwordValidation.valid) {
      errors.new_password = passwordValidation.message;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
  };
};

// ... keep existing validators below ...

/**
 * Validate module code
 */
export const validateModuleCode = (code) => {
  if (!code || !code.trim()) {
    return { valid: false, message: "Module code is required" };
  }

  const cleanCode = code.trim();

  if (cleanCode.length < 3) {
    return {
      valid: false,
      message: "Module code must be at least 3 characters",
    };
  }

  if (cleanCode.length > 50) {
    return {
      valid: false,
      message: "Module code must not exceed 50 characters",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate module name
 */
export const validateModuleName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, message: "Module name is required" };
  }

  const cleanName = name.trim();

  if (cleanName.length < 3) {
    return {
      valid: false,
      message: "Module name must be at least 3 characters",
    };
  }

  if (cleanName.length > 100) {
    return {
      valid: false,
      message: "Module name must not exceed 100 characters",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate age range
 */
export const validateAgeRange = (minAge, maxAge) => {
  const MIN_AGE = 3;
  const MAX_AGE = 18;

  const minValidation = validatePositiveInteger(minAge, "Minimum age");
  if (!minValidation.valid) {
    return minValidation;
  }

  const maxValidation = validatePositiveInteger(maxAge, "Maximum age");
  if (!maxValidation.valid) {
    return maxValidation;
  }

  const min = Number(minAge);
  const max = Number(maxAge);

  if (min < MIN_AGE || min > MAX_AGE) {
    return {
      valid: false,
      message: `Minimum age must be between ${MIN_AGE} and ${MAX_AGE}`,
    };
  }

  if (max < MIN_AGE || max > MAX_AGE) {
    return {
      valid: false,
      message: `Maximum age must be between ${MIN_AGE} and ${MAX_AGE}`,
    };
  }

  if (min > max) {
    return {
      valid: false,
      message: "Minimum age cannot be greater than maximum age",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate division (single)
 */
export const validateDivision = (division) => {
  const validDivisions = ["JK", "LK"];

  if (!division || !division.trim()) {
    return { valid: false, message: "Division is required" };
  }

  const cleanDivision = division.trim().toUpperCase();

  if (!validDivisions.includes(cleanDivision)) {
    return {
      valid: false,
      message: "Division must be either JK or LK",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate branch (single)
 */
export const validateBranch = (branch) => {
  const validBranches = ["SND", "MKW", "KBP"];

  if (!branch || !branch.trim()) {
    return { valid: false, message: "Branch is required" };
  }

  const cleanBranch = branch.trim().toUpperCase();

  if (!validBranches.includes(cleanBranch)) {
    return {
      valid: false,
      message: "Branch must be SND, MKW, or KBP",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const validateDate = (date, fieldName = "Date") => {
  if (!date) {
    return { valid: false, message: `${fieldName} is required` };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return {
      valid: false,
      message: `${fieldName} must be in YYYY-MM-DD format`,
    };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: `${fieldName} is not a valid date` };
  }

  return { valid: true, message: "" };
};

/**
 * Batch validate multiple fields
 */
export const validateFields = (validations) => {
  const errors = {};
  let isValid = true;

  Object.keys(validations).forEach((field) => {
    const validation = validations[field];
    if (!validation.valid) {
      errors[field] = validation.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};
