import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, Users, AlertCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, X, Check, Edit2, Eye, EyeOff, Copy } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "@api/teacherApi";
import { formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Teachers = () => {
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
      patternMessage: "Username can only contain lowercase letters, numbers, and underscores",
    },
    teacher_name: {
      required: true,
      requiredMessage: "Teacher name is required",
      minLength: 3,
      minLengthMessage: "Teacher name must be at least 3 characters",
    },
    teacher_division: {
      required: true,
      requiredMessage: "Division is required",
    },
    teacher_branch: {
      required: true,
      requiredMessage: "Branch is required",
    },
  };

  const addForm = useForm(
    {
      username: "",
      teacher_name: "",
      teacher_division: "",
      teacher_branch: "",
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
      patternMessage: "Username can only contain lowercase letters, numbers, and underscores",
    },
    teacher_name: {
      required: true,
      requiredMessage: "Teacher name is required",
      minLength: 3,
      minLengthMessage: "Teacher name must be at least 3 characters",
    },
    teacher_division: {
      required: true,
      requiredMessage: "Division is required",
    },
    teacher_branch: {
      required: true,
      requiredMessage: "Branch is required",
    },
    // new_password is optional, so no validation here
  };

  const editForm = useForm(
    {
      username: "",
      teacher_name: "",
      teacher_division: "",
      teacher_branch: "",
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
      // Fetch all data without pagination params (backend limitation)
      const params = {};

      const response = await getTeachers(params);

      console.log("=== TEACHERS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);

      if (response.success) {
        let fetchedTeachers = response.data || [];

        // CLIENT-SIDE FILTERING - Search
        if (debouncedSearch.trim()) {
          const searchLower = debouncedSearch.toLowerCase().trim();
          fetchedTeachers = fetchedTeachers.filter((teacher) => teacher.username.toLowerCase().includes(searchLower) || teacher.teacher_name.toLowerCase().includes(searchLower) || teacher.teacher_branch.toLowerCase().includes(searchLower));
        }

        // CLIENT-SIDE FILTERING - Division
        if (filterDivision) {
          fetchedTeachers = fetchedTeachers.filter((teacher) => teacher.teacher_division === filterDivision);
        }

        // CLIENT-SIDE FILTERING - Branch
        if (filterBranch) {
          fetchedTeachers = fetchedTeachers.filter((teacher) => teacher.teacher_branch === filterBranch);
        }

        // Get total after filtering
        const totalFiltered = fetchedTeachers.length;

        // Client-side sorting
        fetchedTeachers = sortTeachers(fetchedTeachers, sortConfig.key, sortConfig.direction);

        // CLIENT-SIDE PAGINATION
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedTeachers = fetchedTeachers.slice(startIndex, endIndex);

        setTeachers(paginatedTeachers);

        // Calculate pagination based on filtered data
        const totalPagesCalculated = Math.ceil(totalFiltered / pagination.pageSize) || 1;

        console.log("=== PAGINATION DEBUG ===");
        console.log("Total filtered:", totalFiltered);
        console.log("Page size:", pagination.pageSize);
        console.log("Total pages calculated:", totalPagesCalculated);
        console.log("Current page:", pagination.currentPage);
        console.log("Showing teachers:", paginatedTeachers.length);
        console.log("Pagination state BEFORE update:", pagination);

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
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, filterDivision, filterBranch, sortConfig.key, sortConfig.direction]);

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
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // =====================================================
  // HANDLERS - CREATE
  // =====================================================

  async function handleAddTeacher(values) {
    try {
      const payload = {
        username: values.username.trim(),
        teacher_name: values.teacher_name.trim(),
        teacher_division: values.teacher_division,
        teacher_branch: values.teacher_branch,
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
    console.log("=== EDIT TEACHER FUNCTION CALLED ===");
    console.log("Form values:", values);
    console.log("Selected teacher:", selectedTeacher);

    try {
      if (!selectedTeacher) {
        console.error("No teacher selected!");
        toast.error("No teacher selected");
        return;
      }

      const payload = {
        username: values.username.trim(),
        teacher_name: values.teacher_name.trim(),
        teacher_division: values.teacher_division,
        teacher_branch: values.teacher_branch,
      };

      // Only include new_password if it's provided
      if (values.new_password && values.new_password.trim()) {
        payload.new_password = values.new_password.trim();
        console.log("Including new password in payload");
      }

      console.log("Payload to send:", payload);
      console.log("Teacher ID:", selectedTeacher.id);

      const response = await updateTeacher(selectedTeacher.id, payload);

      console.log("Update response:", response);
      toast.success("Teacher updated successfully!");

      setShowEditModal(false);
      setSelectedTeacher(null);
      editForm.resetForm();
      await fetchTeachers();
    } catch (err) {
      console.error("=== UPDATE TEACHER ERROR ===");
      console.error("Error object:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to update teacher");
    }
  }

  // =====================================================
  // HANDLERS - DELETE
  // =====================================================

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Are you sure you want to delete teacher "${teacher.teacher_name}"?\n\nThis action CANNOT be undone!`)) {
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
    console.log("=== OPENING EDIT MODAL ===");
    console.log("Teacher data:", teacher);

    setSelectedTeacher(teacher);

    // Reset form first
    editForm.resetForm();

    // Then set each field value individually
    setTimeout(() => {
      editForm.setFieldValue("username", teacher.username);
      editForm.setFieldValue("teacher_name", teacher.teacher_name);
      editForm.setFieldValue("teacher_division", teacher.teacher_division);
      editForm.setFieldValue("teacher_branch", teacher.teacher_branch);
      editForm.setFieldValue("new_password", "");

      console.log("Form values set successfully");
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
  // HELPER FUNCTIONS
  // =====================================================

  const getDivisionBadge = (division) => {
    const badges = {
      JK: { label: "JK", color: "from-blue-500 to-cyan-500" },
      LK: { label: "LK", color: "from-pink-500 to-purple-500" },
    };
    return badges[division] || { label: division, color: "from-gray-500 to-gray-600" };
  };

  const getBranchBadge = (branch) => {
    const badges = {
      SND: { label: "SND", color: "from-green-500 to-emerald-500" },
      MKW: { label: "MKW", color: "from-purple-500 to-pink-500" },
      KBP: { label: "KBP", color: "from-orange-500 to-red-500" },
    };
    return badges[branch] || { label: branch, color: "from-gray-500 to-gray-600" };
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading && teachers.length === 0) {
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
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Teachers</h3>
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
            <h1 className="text-2xl font-bold text-primary">Teacher Management</h1>
            <p className="text-secondary mt-1">Manage teacher accounts and permissions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
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
                    <button onClick={handleClearSearch} className="text-secondary hover:text-primary transition-colors">
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

            {/* Branch Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterBranch}
                onChange={handleBranchFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Branches</option>
                <option value="SND">SND - Sindanglaya</option>
                <option value="MKW">MKW - Margahayu</option>
                <option value="KBP">KBP - Kopo</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterDivision || filterBranch) && (
              <Button variant="ghost" size="medium" onClick={handleClearFilters} icon={<X className="w-4 h-4" />}>
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filterDivision || filterBranch) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-secondary font-medium">Active filters:</span>
              {filterDivision && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Division: {filterDivision}
                  <button onClick={() => setFilterDivision("")} className="hover:bg-primary/20 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterBranch && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Branch: {filterBranch}
                  <button onClick={() => setFilterBranch("")} className="hover:bg-primary/20 rounded">
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
              <h3 className="text-lg font-semibold text-primary mb-2">No Teachers Found</h3>
              <p className="text-secondary text-center mb-6 max-w-md">{searchTerm ? "Try adjusting your search terms" : "Start by creating your first teacher account"}</p>
              <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Add First Teacher
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Username */}
                    <th onClick={() => handleSort("username")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Username
                        <SortIcon columnKey="username" />
                      </div>
                    </th>

                    {/* Teacher Name */}
                    <th onClick={() => handleSort("teacher_name")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon columnKey="teacher_name" />
                      </div>
                    </th>

                    {/* Division */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Division</th>

                    {/* Branch */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Branch</th>

                    {/* Created */}
                    <th onClick={() => handleSort("created_at")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon columnKey="created_at" />
                      </div>
                    </th>

                    {/* Actions */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {teachers.map((teacher) => {
                    const divisionBadge = getDivisionBadge(teacher.teacher_division);
                    const branchBadge = getBranchBadge(teacher.teacher_branch);

                    return (
                      <tr key={teacher.id} className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                        {/* Username */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">{teacher.username}</span>
                          </div>
                        </td>

                        {/* Teacher Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary">{teacher.teacher_name}</span>
                        </td>

                        {/* Division */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${divisionBadge.color} shadow-md`}>{divisionBadge.label}</span>
                          </div>
                        </td>

                        {/* Branch */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${branchBadge.color} shadow-md`}>{branchBadge.label}</span>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">{formatDate(teacher.created_at, DATE_FORMATS.DISPLAY)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(teacher)} className="p-2 rounded-lg text-primary hover:bg-white/30 dark:hover:bg-white/10 transition-colors" title="Edit teacher">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTeacher(teacher)} className="p-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors" title="Delete teacher">
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
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} teachers
                  </p>
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="small" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => {
                          const page = i + 1;
                          if (page === 1 || page === pagination.totalPages || Math.abs(page - pagination.currentPage) <= 1) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${page === pagination.currentPage ? "bg-primary text-white" : "text-primary hover:bg-white/30 dark:hover:bg-white/5"}`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-secondary">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<ChevronRight className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
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
            {addForm.errors.username && <p className="text-sm text-status-error mt-1">{addForm.errors.username}</p>}
            <p className="text-xs text-secondary mt-1">Lowercase letters, numbers, and underscores only</p>
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
            {addForm.errors.teacher_name && <p className="text-sm text-status-error mt-1">{addForm.errors.teacher_name}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Division <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addForm.setFieldValue("teacher_division", "JK")}
                className={`p-4 rounded-xl border-2 transition-all ${addForm.values.teacher_division === "JK" ? "border-blue-500 bg-blue-500/10" : "border-gray-200 dark:border-white/10 hover:border-blue-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></span>
                  <span className="font-semibold text-primary">JK</span>
                </div>
                <p className="text-xs text-secondary">Junior Koders</p>
              </button>

              <button
                type="button"
                onClick={() => addForm.setFieldValue("teacher_division", "LK")}
                className={`p-4 rounded-xl border-2 transition-all ${addForm.values.teacher_division === "LK" ? "border-pink-500 bg-pink-500/10" : "border-gray-200 dark:border-white/10 hover:border-pink-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></span>
                  <span className="font-semibold text-primary">LK</span>
                </div>
                <p className="text-xs text-secondary">Little Koders</p>
              </button>
            </div>
            {addForm.errors.teacher_division && <p className="text-sm text-status-error mt-1">{addForm.errors.teacher_division}</p>}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => addForm.setFieldValue("teacher_branch", "SND")}
                className={`p-3 rounded-xl border-2 transition-all ${addForm.values.teacher_branch === "SND" ? "border-green-500 bg-green-500/10" : "border-gray-200 dark:border-white/10 hover:border-green-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
                  <span className="font-semibold text-primary text-sm">SND</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => addForm.setFieldValue("teacher_branch", "MKW")}
                className={`p-3 rounded-xl border-2 transition-all ${addForm.values.teacher_branch === "MKW" ? "border-purple-500 bg-purple-500/10" : "border-gray-200 dark:border-white/10 hover:border-purple-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
                  <span className="font-semibold text-primary text-sm">MKW</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => addForm.setFieldValue("teacher_branch", "KBP")}
                className={`p-3 rounded-xl border-2 transition-all ${addForm.values.teacher_branch === "KBP" ? "border-orange-500 bg-orange-500/10" : "border-gray-200 dark:border-white/10 hover:border-orange-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
                  <span className="font-semibold text-primary text-sm">KBP</span>
                </div>
              </button>
            </div>
            {addForm.errors.teacher_branch && <p className="text-sm text-status-error mt-1">{addForm.errors.teacher_branch}</p>}
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">Password Generation</p>
              <p className="text-sm text-secondary">A secure random password will be generated and displayed after creation. Make sure to save it!</p>
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
            <Button type="submit" variant="primary" size="medium" icon={<Check className="w-4 h-4" />} disabled={addForm.isSubmitting} loading={addForm.isSubmitting} className="flex-1">
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
        <form
          onSubmit={(e) => {
            console.log("=== EDIT FORM SUBMIT EVENT ===");
            console.log("Event:", e);
            console.log("Form values before submit:", editForm.values);
            console.log("Form errors:", editForm.errors);
            editForm.handleSubmit(e);
          }}
          className="space-y-4"
        >
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
            {editForm.errors.username && <p className="text-sm text-status-error mt-1">{editForm.errors.username}</p>}
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
            {editForm.errors.teacher_name && <p className="text-sm text-status-error mt-1">{editForm.errors.teacher_name}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Division <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => editForm.setFieldValue("teacher_division", "JK")}
                className={`p-4 rounded-xl border-2 transition-all ${editForm.values.teacher_division === "JK" ? "border-blue-500 bg-blue-500/10" : "border-gray-200 dark:border-white/10 hover:border-blue-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></span>
                  <span className="font-semibold text-primary">JK</span>
                </div>
                <p className="text-xs text-secondary">Junior Koders</p>
              </button>

              <button
                type="button"
                onClick={() => editForm.setFieldValue("teacher_division", "LK")}
                className={`p-4 rounded-xl border-2 transition-all ${editForm.values.teacher_division === "LK" ? "border-pink-500 bg-pink-500/10" : "border-gray-200 dark:border-white/10 hover:border-pink-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></span>
                  <span className="font-semibold text-primary">LK</span>
                </div>
                <p className="text-xs text-secondary">Little Koders</p>
              </button>
            </div>
            {editForm.errors.teacher_division && <p className="text-sm text-status-error mt-1">{editForm.errors.teacher_division}</p>}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => editForm.setFieldValue("teacher_branch", "SND")}
                className={`p-3 rounded-xl border-2 transition-all ${editForm.values.teacher_branch === "SND" ? "border-green-500 bg-green-500/10" : "border-gray-200 dark:border-white/10 hover:border-green-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
                  <span className="font-semibold text-primary text-sm">SND</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => editForm.setFieldValue("teacher_branch", "MKW")}
                className={`p-3 rounded-xl border-2 transition-all ${editForm.values.teacher_branch === "MKW" ? "border-purple-500 bg-purple-500/10" : "border-gray-200 dark:border-white/10 hover:border-purple-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
                  <span className="font-semibold text-primary text-sm">MKW</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => editForm.setFieldValue("teacher_branch", "KBP")}
                className={`p-3 rounded-xl border-2 transition-all ${editForm.values.teacher_branch === "KBP" ? "border-orange-500 bg-orange-500/10" : "border-gray-200 dark:border-white/10 hover:border-orange-500/50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
                  <span className="font-semibold text-primary text-sm">KBP</span>
                </div>
              </button>
            </div>
            {editForm.errors.teacher_branch && <p className="text-sm text-status-error mt-1">{editForm.errors.teacher_branch}</p>}
          </div>

          {/* New Password (Optional) */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">New Password (Optional)</label>
            <input
              type="password"
              name="new_password"
              value={editForm.values.new_password}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-secondary mt-1">Minimum 6 characters. Leave empty to keep current password.</p>
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
            <Button type="submit" variant="primary" size="medium" icon={<Check className="w-4 h-4" />} disabled={editForm.isSubmitting} loading={editForm.isSubmitting} className="flex-1">
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
              <p className="text-sm font-semibold text-primary">Teacher account created!</p>
              <p className="text-sm text-secondary mt-1">Please save this password. It will not be shown again.</p>
            </div>
          </div>

          {/* Password Display */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Generated Password</label>
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button type="button" onClick={handleCopyPassword} className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors" title="Copy password">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">Important!</p>
              <p className="text-sm text-secondary">This password cannot be retrieved later. Make sure to copy and save it securely before closing this window.</p>
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
