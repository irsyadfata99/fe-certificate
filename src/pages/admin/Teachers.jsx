import { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  Plus,
  Search,
  Trash2,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  X,
  Check,
  Edit2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { useBranchOptions } from "@hooks/useBranches";
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "@api/teacherApi";
import {
  formatDate,
  formatBranchesArray,
  formatDivisionsArray,
  formatBranchBadges,
  formatDivisionBadges,
} from "@utils/formatters";
import { validateTeacherForm } from "@utils/validators";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Teachers = () => {
  // =====================================================
  // DYNAMIC BRANCHES
  // =====================================================
  const { branchOptions, loading: branchesLoading } = useBranchOptions();

  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 8,
    total: 0,
    totalPages: 0,
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filter states
  const [filterDivision, setFilterDivision] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // DIVISION OPTIONS (Static)
  // =====================================================
  const divisionOptions = [
    { value: "JK", label: "JK - Junior Koders" },
    { value: "LK", label: "LK - Little Koders" },
  ];

  // =====================================================
  // REACT-SELECT CUSTOM STYLES
  // =====================================================
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: state.isFocused
        ? "rgba(100, 149, 237, 0.5)"
        : "rgba(156, 163, 175, 0.3)",
      borderRadius: "0.75rem",
      minHeight: "42px",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(100, 149, 237, 0.1)"
        : "none",
      "&:hover": {
        borderColor: "rgba(100, 149, 237, 0.5)",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      borderRadius: "0.75rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(156, 163, 175, 0.2)",
      overflow: "hidden",
    }),
    menuList: (base) => ({
      ...base,
      padding: "0.5rem",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgba(100, 149, 237, 0.1)"
        : state.isFocused
          ? "rgba(100, 149, 237, 0.05)"
          : "transparent",
      color: state.isSelected ? "#6495ED" : "#1E293B",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.75rem",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "rgba(100, 149, 237, 0.15)",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "rgba(100, 149, 237, 0.1)",
      borderRadius: "0.5rem",
      padding: "0.125rem 0.25rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#6495ED",
      fontWeight: "500",
      fontSize: "0.875rem",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#6495ED",
      borderRadius: "0.25rem",
      "&:hover": {
        backgroundColor: "rgba(100, 149, 237, 0.2)",
        color: "#4169E1",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94A3B8",
    }),
    input: (base) => ({
      ...base,
      color: "#1E293B",
    }),
  };

  // =====================================================
  // FORM VALIDATION - ADD TEACHER
  // =====================================================

  const addValidationSchema = {
    username: {
      required: true,
      requiredMessage: "Username is required",
      minLength: 3,
      minLengthMessage: "Username must be at least 3 characters",
      maxLength: 50,
      maxLengthMessage: "Username must not exceed 50 characters",
      pattern: /^[a-z0-9_]+$/,
      patternMessage:
        "Username can only contain lowercase letters, numbers, and underscores",
    },
    teacher_name: {
      required: true,
      requiredMessage: "Teacher name is required",
      minLength: 3,
      minLengthMessage: "Teacher name must be at least 3 characters",
    },
    branches: {
      required: true,
      requiredMessage: "At least one branch must be selected",
      validate: (value) => {
        if (!value || value.length === 0) {
          return "At least one branch must be selected";
        }
        return null;
      },
    },
    divisions: {
      required: true,
      requiredMessage: "At least one division must be selected",
      validate: (value) => {
        if (!value || value.length === 0) {
          return "At least one division must be selected";
        }
        return null;
      },
    },
  };

  const addForm = useForm(
    {
      username: "",
      teacher_name: "",
      branches: [],
      divisions: [],
    },
    {
      validationSchema: addValidationSchema,
      onSubmit: handleAddTeacher,
    },
  );

  // =====================================================
  // FORM VALIDATION - EDIT TEACHER
  // =====================================================

  const editValidationSchema = {
    username: {
      required: true,
      requiredMessage: "Username is required",
      minLength: 3,
      minLengthMessage: "Username must be at least 3 characters",
      maxLength: 50,
      maxLengthMessage: "Username must not exceed 50 characters",
      pattern: /^[a-z0-9_]+$/,
      patternMessage:
        "Username can only contain lowercase letters, numbers, and underscores",
    },
    teacher_name: {
      required: true,
      requiredMessage: "Teacher name is required",
      minLength: 3,
      minLengthMessage: "Teacher name must be at least 3 characters",
    },
    branches: {
      required: true,
      requiredMessage: "At least one branch must be selected",
      validate: (value) => {
        if (!value || value.length === 0) {
          return "At least one branch must be selected";
        }
        return null;
      },
    },
    divisions: {
      required: true,
      requiredMessage: "At least one division must be selected",
      validate: (value) => {
        if (!value || value.length === 0) {
          return "At least one division must be selected";
        }
        return null;
      },
    },
  };

  const editForm = useForm(
    {
      username: "",
      teacher_name: "",
      branches: [],
      divisions: [],
      new_password: "",
    },
    {
      validationSchema: editValidationSchema,
      onSubmit: handleEditTeacher,
    },
  );

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      const response = await getTeachers(params);

      if (response.success) {
        let fetchedTeachers = response.data || [];

        // CLIENT-SIDE FILTERING - Search
        if (debouncedSearch.trim()) {
          const searchLower = debouncedSearch.toLowerCase().trim();
          fetchedTeachers = fetchedTeachers.filter((teacher) => {
            const matchesUsername = teacher.username
              .toLowerCase()
              .includes(searchLower);
            const matchesName = teacher.teacher_name
              .toLowerCase()
              .includes(searchLower);

            // Search in branches
            const matchesBranches = teacher.branches?.some(
              (b) =>
                b.branch_code.toLowerCase().includes(searchLower) ||
                b.branch_name.toLowerCase().includes(searchLower),
            );

            return matchesUsername || matchesName || matchesBranches;
          });
        }

        // CLIENT-SIDE FILTERING - Division
        if (filterDivision) {
          fetchedTeachers = fetchedTeachers.filter((teacher) =>
            teacher.divisions?.includes(filterDivision),
          );
        }

        // CLIENT-SIDE FILTERING - Branch
        if (filterBranch) {
          fetchedTeachers = fetchedTeachers.filter((teacher) =>
            teacher.branches?.some((b) => b.branch_code === filterBranch),
          );
        }

        // Get total after filtering
        const totalFiltered = fetchedTeachers.length;

        // Client-side sorting
        fetchedTeachers = sortTeachers(
          fetchedTeachers,
          sortConfig.key,
          sortConfig.direction,
        );

        // CLIENT-SIDE PAGINATION
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedTeachers = fetchedTeachers.slice(startIndex, endIndex);

        setTeachers(paginatedTeachers);

        // Calculate pagination based on filtered data
        const totalPagesCalculated =
          Math.ceil(totalFiltered / pagination.pageSize) || 1;

        setPagination((prev) => ({
          ...prev,
          total: totalFiltered,
          totalPages: totalPagesCalculated,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      setError("Failed to load teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    filterDivision,
    filterBranch,
    sortConfig.key,
    sortConfig.direction,
  ]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // =====================================================
  // SORTING FUNCTION
  // =====================================================

  const sortTeachers = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle different data types
      if (key === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // =====================================================
  // HANDLE SORT
  // =====================================================

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // =====================================================
  // SORT ICON COMPONENT
  // =====================================================

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // =====================================================
  // HANDLERS - CREATE
  // =====================================================

  async function handleAddTeacher(values) {
    try {
      const payload = {
        username: values.username.trim(),
        teacher_name: values.teacher_name.trim(),
        branchCodes: values.branches, // Array of branch codes
        divisions: values.divisions, // Array of division codes
        branchOptions: branchOptions, // CRITICAL: Pass branch options for ID conversion
      };

      const response = await createTeacher(payload);

      if (response.success && response.data.generatedPassword) {
        setGeneratedPassword(response.data.generatedPassword);
        setShowPasswordModal(true);
        toast.success("Teacher created successfully!");
      }

      setShowAddModal(false);
      addForm.resetForm();
      await fetchTeachers();
    } catch (err) {
      console.error("Failed to create teacher:", err);
      toast.error(err.response?.data?.message || "Failed to create teacher");
    }
  }

  // =====================================================
  // HANDLERS - EDIT
  // =====================================================

  async function handleEditTeacher(values) {
    try {
      if (!selectedTeacher) {
        toast.error("No teacher selected");
        return;
      }

      const payload = {
        username: values.username.trim(),
        teacher_name: values.teacher_name.trim(),
        branchCodes: values.branches, // Array of branch codes
        divisions: values.divisions, // Array of division codes
        branchOptions: branchOptions, // CRITICAL: Pass branch options for ID conversion
      };

      // Only include new_password if it's provided
      if (values.new_password && values.new_password.trim()) {
        payload.new_password = values.new_password.trim();
      }

      const response = await updateTeacher(selectedTeacher.id, payload);

      toast.success("Teacher updated successfully!");

      setShowEditModal(false);
      setSelectedTeacher(null);
      editForm.resetForm();
      await fetchTeachers();
    } catch (err) {
      console.error("Failed to update teacher:", err);
      toast.error(err.response?.data?.message || "Failed to update teacher");
    }
  }

  // =====================================================
  // HANDLERS - DELETE
  // =====================================================

  const handleDeleteTeacher = async (teacher) => {
    if (
      !window.confirm(
        `Are you sure you want to delete teacher "${teacher.teacher_name}"?\n\nThis action CANNOT be undone!`,
      )
    ) {
      return;
    }

    try {
      await deleteTeacher(teacher.id);
      toast.success("Teacher deleted successfully!");
      await fetchTeachers();
    } catch (err) {
      console.error("Failed to delete teacher:", err);
      toast.error(err.response?.data?.message || "Failed to delete teacher");
    }
  };

  // =====================================================
  // HANDLERS - OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);

    // Reset form first
    editForm.resetForm();

    // Convert branches array to branch codes for react-select
    const branchCodes = teacher.branches?.map((b) => b.branch_code) || [];
    const divisions = teacher.divisions || [];

    // Set form values
    setTimeout(() => {
      editForm.setFieldValue("username", teacher.username);
      editForm.setFieldValue("teacher_name", teacher.teacher_name);
      editForm.setFieldValue("branches", branchCodes);
      editForm.setFieldValue("divisions", divisions);
      editForm.setFieldValue("new_password", "");
    }, 0);

    setShowEditModal(true);
  };

  // =====================================================
  // HANDLERS - SEARCH & FILTERS
  // =====================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDivisionFilterChange = (e) => {
    setFilterDivision(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleBranchFilterChange = (e) => {
    setFilterBranch(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterDivision("");
    setFilterBranch("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // =====================================================
  // HANDLERS - PAGINATION
  // =====================================================

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  // =====================================================
  // HANDLERS - COPY PASSWORD
  // =====================================================

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Password copied to clipboard!");
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if ((loading || branchesLoading) && teachers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && teachers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Failed to Load Teachers
          </h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={fetchTeachers} size="medium">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Teacher Management
            </h1>
            <p className="text-secondary mt-1">
              Manage teacher accounts with multi-branch & multi-division support
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="medium"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Teacher
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                name="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by username, name, or branch..."
                prefixIcon={<Search className="w-5 h-5" />}
                suffixIcon={
                  searchTerm ? (
                    <button
                      onClick={handleClearSearch}
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-3">
            {/* Division Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterDivision}
                onChange={handleDivisionFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Divisions</option>
                <option value="JK">JK - Junior Koders</option>
                <option value="LK">LK - Little Koders</option>
              </select>
            </div>

            {/* Branch Filter - Dynamic */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterBranch}
                onChange={handleBranchFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Branches</option>
                {branchOptions.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterDivision || filterBranch) && (
              <Button
                variant="ghost"
                size="medium"
                onClick={handleClearFilters}
                icon={<X className="w-4 h-4" />}
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filterDivision || filterBranch) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-secondary font-medium">
                Active filters:
              </span>
              {filterDivision && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Division: {filterDivision}
                  <button
                    onClick={() => setFilterDivision("")}
                    className="hover:bg-primary/20 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterBranch && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Branch: {filterBranch}
                  <button
                    onClick={() => setFilterBranch("")}
                    className="hover:bg-primary/20 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Teachers Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No Teachers Found
              </h3>
              <p className="text-secondary text-center mb-6 max-w-md">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start by creating your first teacher account"}
              </p>
              <Button
                variant="primary"
                size="medium"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Add First Teacher
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Username */}
                    <th
                      onClick={() => handleSort("username")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Username
                        <SortIcon columnKey="username" />
                      </div>
                    </th>

                    {/* Teacher Name */}
                    <th
                      onClick={() => handleSort("teacher_name")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon columnKey="teacher_name" />
                      </div>
                    </th>

                    {/* Branches */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">
                      Branches
                    </th>

                    {/* Divisions */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">
                      Divisions
                    </th>

                    {/* Created */}
                    <th
                      onClick={() => handleSort("created_at")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon columnKey="created_at" />
                      </div>
                    </th>

                    {/* Actions */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {teachers.map((teacher) => {
                    const branchBadges = formatBranchBadges(teacher.branches);
                    const divisionBadges = formatDivisionBadges(
                      teacher.divisions,
                    );

                    return (
                      <tr
                        key={teacher.id}
                        className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                      >
                        {/* Username */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {teacher.username}
                            </span>
                          </div>
                        </td>

                        {/* Teacher Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary">
                            {teacher.teacher_name}
                          </span>
                        </td>

                        {/* Branches */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {branchBadges.length > 0 ? (
                              branchBadges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${badge.color} shadow-sm`}
                                  title={badge.name}
                                >
                                  {badge.label}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-secondary">-</span>
                            )}
                          </div>
                        </td>

                        {/* Divisions */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {divisionBadges.length > 0 ? (
                              divisionBadges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${badge.color} shadow-sm`}
                                  title={badge.name}
                                >
                                  {badge.label}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-secondary">-</span>
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">
                              {formatDate(
                                teacher.created_at,
                                DATE_FORMATS.DISPLAY,
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="p-2 rounded-lg text-primary hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                              title="Edit teacher"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher)}
                              className="p-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors"
                              title="Delete teacher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="p-6 border-t border-gray-200/50 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.total,
                    )}{" "}
                    of {pagination.total} teachers
                  </p>
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<ChevronLeft className="w-4 h-4" />}
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: pagination.totalPages },
                          (_, i) => {
                            const page = i + 1;
                            if (
                              page === 1 ||
                              page === pagination.totalPages ||
                              Math.abs(page - pagination.currentPage) <= 1
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${page === pagination.currentPage ? "bg-primary text-white" : "text-primary hover:bg-white/30 dark:hover:bg-white/5"}`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (
                              page === pagination.currentPage - 2 ||
                              page === pagination.currentPage + 2
                            ) {
                              return (
                                <span
                                  key={page}
                                  className="px-2 text-secondary"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          },
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<ChevronRight className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* ADD TEACHER MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.resetForm();
        }}
        title="Add New Teacher"
        size="medium"
      >
        <form onSubmit={addForm.handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Username <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={addForm.values.username}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., john_doe"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.errors.username && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.username}
              </p>
            )}
            <p className="text-xs text-secondary mt-1">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Teacher Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Full Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="teacher_name"
              value={addForm.values.teacher_name}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.errors.teacher_name && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.teacher_name}
              </p>
            )}
          </div>

          {/* Branches - Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branches <span className="text-status-error">*</span>
            </label>
            <Select
              isMulti
              options={branchOptions}
              value={branchOptions.filter((opt) =>
                addForm.values.branches.includes(opt.value),
              )}
              onChange={(selected) => {
                const values = selected ? selected.map((s) => s.value) : [];
                addForm.setFieldValue("branches", values);
              }}
              placeholder="Select branches..."
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {addForm.errors.branches && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.branches}
              </p>
            )}
            <p className="text-xs text-secondary mt-1">
              Teacher can be assigned to multiple branches
            </p>
          </div>

          {/* Divisions - Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Divisions <span className="text-status-error">*</span>
            </label>
            <Select
              isMulti
              options={divisionOptions}
              value={divisionOptions.filter((opt) =>
                addForm.values.divisions.includes(opt.value),
              )}
              onChange={(selected) => {
                const values = selected ? selected.map((s) => s.value) : [];
                addForm.setFieldValue("divisions", values);
              }}
              placeholder="Select divisions..."
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {addForm.errors.divisions && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.divisions}
              </p>
            )}
            <p className="text-xs text-secondary mt-1">
              Teacher can teach multiple divisions
            </p>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                Password Generation
              </p>
              <p className="text-sm text-secondary">
                A secure random password will be generated and displayed after
                creation. Make sure to save it!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="medium"
              onClick={() => {
                setShowAddModal(false);
                addForm.resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="medium"
              icon={<Check className="w-4 h-4" />}
              disabled={addForm.isSubmitting}
              loading={addForm.isSubmitting}
              className="flex-1"
            >
              Create Teacher
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* EDIT TEACHER MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTeacher(null);
          editForm.resetForm();
        }}
        title="Edit Teacher"
        size="medium"
      >
        <form onSubmit={editForm.handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Username <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={editForm.values.username}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="e.g., john_doe"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {editForm.errors.username && (
              <p className="text-sm text-status-error mt-1">
                {editForm.errors.username}
              </p>
            )}
          </div>

          {/* Teacher Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Full Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="teacher_name"
              value={editForm.values.teacher_name}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {editForm.errors.teacher_name && (
              <p className="text-sm text-status-error mt-1">
                {editForm.errors.teacher_name}
              </p>
            )}
          </div>

          {/* Branches - Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branches <span className="text-status-error">*</span>
            </label>
            <Select
              isMulti
              options={branchOptions}
              value={branchOptions.filter((opt) =>
                editForm.values.branches.includes(opt.value),
              )}
              onChange={(selected) => {
                const values = selected ? selected.map((s) => s.value) : [];
                editForm.setFieldValue("branches", values);
              }}
              placeholder="Select branches..."
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {editForm.errors.branches && (
              <p className="text-sm text-status-error mt-1">
                {editForm.errors.branches}
              </p>
            )}
          </div>

          {/* Divisions - Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Divisions <span className="text-status-error">*</span>
            </label>
            <Select
              isMulti
              options={divisionOptions}
              value={divisionOptions.filter((opt) =>
                editForm.values.divisions.includes(opt.value),
              )}
              onChange={(selected) => {
                const values = selected ? selected.map((s) => s.value) : [];
                editForm.setFieldValue("divisions", values);
              }}
              placeholder="Select divisions..."
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {editForm.errors.divisions && (
              <p className="text-sm text-status-error mt-1">
                {editForm.errors.divisions}
              </p>
            )}
          </div>

          {/* New Password (Optional) */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              New Password (Optional)
            </label>
            <input
              type="password"
              name="new_password"
              value={editForm.values.new_password}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-secondary mt-1">
              Minimum 8 characters. Leave empty to keep current password.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="medium"
              onClick={() => {
                setShowEditModal(false);
                setSelectedTeacher(null);
                editForm.resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="medium"
              icon={<Check className="w-4 h-4" />}
              disabled={editForm.isSubmitting}
              loading={editForm.isSubmitting}
              className="flex-1"
            >
              Update Teacher
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* GENERATED PASSWORD MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setGeneratedPassword("");
          setShowPassword(false);
        }}
        title="Teacher Created Successfully"
        size="small"
      >
        <div className="space-y-4">
          {/* Success Message */}
          <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-xl">
            <div className="p-2 rounded-lg bg-green-500">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">
                Teacher account created!
              </p>
              <p className="text-sm text-secondary mt-1">
                Please save this password. It will not be shown again.
              </p>
            </div>
          </div>

          {/* Password Display */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Generated Password
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-primary hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                title="Copy password"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                Important!
              </p>
              <p className="text-sm text-secondary">
                This password cannot be retrieved later. Make sure to copy and
                save it securely before closing this window.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="medium"
              onClick={() => {
                setShowPasswordModal(false);
                setGeneratedPassword("");
                setShowPassword(false);
              }}
              className="w-full"
            >
              I've Saved the Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Teachers;
