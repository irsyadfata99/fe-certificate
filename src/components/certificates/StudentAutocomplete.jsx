import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FiSearch, FiUser, FiX } from "react-icons/fi";
import { searchStudentsForPrint } from "@services/printedCertificateApi";

/**
 * StudentAutocomplete Component
 * Provides autocomplete search for student names with debouncing
 */
const StudentAutocomplete = ({
  value,
  onChange,
  onSelect,
  branchCode,
  error,
  disabled,
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // =====================================================
  // DEBOUNCED SEARCH
  // =====================================================
  useEffect(() => {
    // Only search if value is from user typing (not from selection)
    if (value && value.length >= 2 && value !== searchQuery) {
      setSearchQuery(value);

      const debounceTimer = setTimeout(() => {
        handleSearch(value);
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else if (!value) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [value]);

  // =====================================================
  // SEARCH API CALL
  // =====================================================
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await searchStudentsForPrint(query, branchCode, 10);

      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowDropdown(response.data.length > 0);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Student search failed:", error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // =====================================================
  // HANDLE STUDENT SELECTION
  // =====================================================
  const handleSelectStudent = (student) => {
    setSearchQuery(student.student_name); // Prevent re-search
    onSelect(student);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e); // Pass to parent

    // If user manually types after selection, reset search query
    if (newValue !== searchQuery) {
      setSearchQuery("");
    }
  };

  // =====================================================
  // HANDLE CLEAR
  // =====================================================
  const handleClear = () => {
    const syntheticEvent = {
      target: {
        name: "studentName",
        value: "",
      },
    };
    onChange(syntheticEvent);
    setSearchResults([]);
    setShowDropdown(false);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // =====================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =====================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="studentName"
          value={value}
          onChange={handleInputChange}
          placeholder="Type student name to search..."
          className={`w-full px-4 py-2 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Search Icon */}
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX />
          </button>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((student) => (
              <li
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {student.student_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Branch: {student.branch_code}
                      {student.branch_name && ` (${student.branch_name})`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && !isSearching && searchResults.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">
            No students found. You can still type the name manually.
          </p>
        </div>
      )}
    </div>
  );
};

StudentAutocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  branchCode: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
};

StudentAutocomplete.defaultProps = {
  branchCode: null,
  error: "",
  disabled: false,
};

export default StudentAutocomplete;
