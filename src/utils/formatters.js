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
 * Format branch name
 * @param {string} branch
 * @returns {string}
 */
export const formatBranch = (branch) => {
  const branchNames = {
    SND: "Sudirman",
    MKW: "Makwana",
    KBP: "Kopo Permai",
  };
  return branchNames[branch] || branch;
};

/**
 * Format division name
 * @param {string} division
 * @returns {string}
 */
export const formatDivision = (division) => {
  const divisionNames = {
    JK: "Junior Kids",
    LK: "Lanjutan Kids",
  };
  return divisionNames[division] || division;
};
