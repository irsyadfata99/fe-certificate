import { format } from "date-fns";

/**
 * Format number with thousands separator
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format date to readable string
 * @param {string|Date} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = "dd MMM yyyy") => {
  if (!date) return "-";
  try {
    return format(new Date(date), formatStr);
  } catch (error) {
    return "-";
  }
};

/**
 * Format date with time
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  return formatDate(date, "dd MMM yyyy HH:mm");
};

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format branch name (single)
 * @param {string} branch
 * @returns {string}
 */
export const formatBranch = (branch) => {
  const branchNames = {
    SND: "Sunda",
    MKW: "Mekarwangi",
    KBP: "Kota Baru Parahyangan",
  };
  return branchNames[branch] || branch;
};

/**
 * Format division name (single)
 * @param {string} division
 * @returns {string}
 */
export const formatDivision = (division) => {
  const divisionNames = {
    JK: "Junior Koders",
    LK: "Little Koders",
  };
  return divisionNames[division] || division;
};

// =====================================================
// NEW: ARRAY FORMATTERS FOR MULTI-BRANCH/DIVISION
// =====================================================

/**
 * Format array of branches to comma-separated string
 * @param {Array} branches - Array of branch objects [{branch_code, branch_name}] or branch codes ["SND", "MKW"]
 * @param {Object} options - Formatting options
 * @returns {string}
 */
export const formatBranchesArray = (branches, options = {}) => {
  const { showFullName = false, separator = ", ", maxDisplay = null } = options;

  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return "-";
  }

  // Handle array of objects [{branch_code, branch_name}]
  const branchCodes = branches.map((b) => {
    if (typeof b === "object" && b.branch_code) {
      return showFullName ? b.branch_name || b.branch_code : b.branch_code;
    }
    // Handle array of strings ["SND", "MKW"]
    return showFullName ? formatBranch(b) : b;
  });

  // Apply max display limit
  if (maxDisplay && branchCodes.length > maxDisplay) {
    const displayedBranches = branchCodes.slice(0, maxDisplay);
    const remaining = branchCodes.length - maxDisplay;
    return `${displayedBranches.join(separator)} +${remaining} more`;
  }

  return branchCodes.join(separator);
};

/**
 * Format array of divisions to comma-separated string
 * @param {Array} divisions - Array of division codes ["JK", "LK"]
 * @param {Object} options - Formatting options
 * @returns {string}
 */
export const formatDivisionsArray = (divisions, options = {}) => {
  const { showFullName = false, separator = ", ", maxDisplay = null } = options;

  if (!divisions || !Array.isArray(divisions) || divisions.length === 0) {
    return "-";
  }

  const formattedDivisions = divisions.map((d) =>
    showFullName ? formatDivision(d) : d,
  );

  // Apply max display limit
  if (maxDisplay && formattedDivisions.length > maxDisplay) {
    const displayedDivisions = formattedDivisions.slice(0, maxDisplay);
    const remaining = formattedDivisions.length - maxDisplay;
    return `${displayedDivisions.join(separator)} +${remaining} more`;
  }

  return formattedDivisions.join(separator);
};

/**
 * Format branches array as badges/chips data
 * @param {Array} branches - Array of branch objects or codes
 * @returns {Array} Array of badge objects with color and label
 */
export const formatBranchBadges = (branches) => {
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return [];
  }

  const badgeColors = {
    SND: {
      label: "SND",
      color: "from-green-500 to-emerald-500",
      name: "Sunda",
    },
    MKW: {
      label: "MKW",
      color: "from-purple-500 to-pink-500",
      name: "Mekarwangi",
    },
    KBP: { label: "KBP", color: "from-orange-500 to-red-500", name: "Kopo" },
  };

  return branches.map((b) => {
    const code = typeof b === "object" ? b.branch_code : b;
    return (
      badgeColors[code] || {
        label: code,
        color: "from-gray-500 to-gray-600",
        name: code,
      }
    );
  });
};

/**
 * Format divisions array as badges/chips data
 * @param {Array} divisions - Array of division codes
 * @returns {Array} Array of badge objects with color and label
 */
export const formatDivisionBadges = (divisions) => {
  if (!divisions || !Array.isArray(divisions) || divisions.length === 0) {
    return [];
  }

  const badgeColors = {
    JK: {
      label: "JK",
      color: "from-blue-500 to-cyan-500",
      name: "Junior Koders",
    },
    LK: {
      label: "LK",
      color: "from-pink-500 to-purple-500",
      name: "Little Koders",
    },
  };

  return divisions.map((d) => {
    return (
      badgeColors[d] || {
        label: d,
        color: "from-gray-500 to-gray-600",
        name: d,
      }
    );
  });
};

/**
 * Format teacher assignments summary
 * @param {Object} teacher - Teacher object with branches and divisions arrays
 * @returns {string} Formatted summary (e.g., "SND, MKW · JK, LK")
 */
export const formatTeacherAssignments = (teacher) => {
  if (!teacher) return "-";

  const branches = formatBranchesArray(teacher.branches);
  const divisions = formatDivisionsArray(teacher.divisions);

  if (branches === "-" && divisions === "-") return "-";
  if (branches === "-") return divisions;
  if (divisions === "-") return branches;

  return `${branches} · ${divisions}`;
};

/**
 * Get assignment count summary
 * @param {Object} teacher - Teacher object
 * @returns {string} Summary like "3 branches, 2 divisions"
 */
export const formatAssignmentCount = (teacher) => {
  if (!teacher) return "-";

  const branchCount = teacher.branches?.length || 0;
  const divisionCount = teacher.divisions?.length || 0;

  const parts = [];
  if (branchCount > 0) {
    parts.push(`${branchCount} branch${branchCount !== 1 ? "es" : ""}`);
  }
  if (divisionCount > 0) {
    parts.push(`${divisionCount} division${divisionCount !== 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join(", ") : "-";
};
