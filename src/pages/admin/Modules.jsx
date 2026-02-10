import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, BookOpen, AlertCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, X, Check, Edit2 } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { getModules, createModule, updateModule, deleteModule } from "@api/moduleApi";
import { formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Modules = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [modules, setModules] = useState([]);
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
  const [filterAgeRange, setFilterAgeRange] = useState("");

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  // =====================================================
  // AGE RANGE OPTIONS
  // =====================================================
  const ageRangeOptions = {
    LK: [
      { label: "4-6 tahun", min: 4, max: 6 },
      { label: "6-8 tahun", min: 6, max: 8 },
    ],
    JK: [
      { label: "8-12 tahun", min: 8, max: 12 },
      { label: "12-16 tahun", min: 12, max: 16 },
    ],
  };

  // =====================================================
  // FORM VALIDATION - ADD MODULE
  // =====================================================

  const addValidationSchema = {
    module_code: {
      required: true,
      requiredMessage: "Module code is required",
      minLength: 2,
      minLengthMessage: "Module code must be at least 2 characters",
      maxLength: 50,
      maxLengthMessage: "Module code must not exceed 50 characters",
    },
    module_name: {
      required: true,
      requiredMessage: "Module name is required",
      minLength: 3,
      minLengthMessage: "Module name must be at least 3 characters",
    },
    division: {
      required: true,
      requiredMessage: "Division is required",
    },
    age_range: {
      required: true,
      requiredMessage: "Age range is required",
    },
  };

  const addForm = useForm(
    {
      module_code: "",
      module_name: "",
      division: "",
      age_range: "",
    },
    {
      validationSchema: addValidationSchema,
      onSubmit: handleAddModule,
    },
  );

  // =====================================================
  // FORM VALIDATION - EDIT MODULE
  // =====================================================

  const editValidationSchema = {
    module_code: {
      required: true,
      requiredMessage: "Module code is required",
      minLength: 2,
      minLengthMessage: "Module code must be at least 2 characters",
      maxLength: 50,
      maxLengthMessage: "Module code must not exceed 50 characters",
    },
    module_name: {
      required: true,
      requiredMessage: "Module name is required",
      minLength: 3,
      minLengthMessage: "Module name must be at least 3 characters",
    },
    division: {
      required: true,
      requiredMessage: "Division is required",
    },
    age_range: {
      required: true,
      requiredMessage: "Age range is required",
    },
  };

  const editForm = useForm(
    {
      module_code: "",
      module_name: "",
      division: "",
      age_range: "",
    },
    {
      validationSchema: editValidationSchema,
      onSubmit: handleEditModule,
    },
  );

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (pagination.currentPage - 1) * pagination.pageSize;

      const params = {
        limit: pagination.pageSize,
        offset,
      };

      // Add search param if exists
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Add division filter if selected
      if (filterDivision) {
        params.division = filterDivision;
      }

      // Add age range filter if selected
      if (filterAgeRange) {
        const [min, max] = filterAgeRange.split("-").map(Number);
        params.min_age = min;
        params.max_age = max;
      }

      const response = await getModules(params);

      console.log("=== MODULES API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      console.log("Response meta:", response.meta);
      console.log("Response meta.pagination:", response.meta?.pagination);

      if (response.success) {
        let fetchedModules = response.data || [];

        // Client-side sorting only (backend handles filtering)
        fetchedModules = sortModules(fetchedModules, sortConfig.key, sortConfig.direction);

        setModules(fetchedModules);

        // FIX: Backend sends pagination data in response.meta.pagination
        const paginationData = response.meta?.pagination || {};
        const totalFromBackend = paginationData.total || 0;
        const totalPagesFromBackend = paginationData.totalPages || Math.ceil(totalFromBackend / pagination.pageSize) || 1;

        console.log("Pagination data:", paginationData);
        console.log("Total from backend:", totalFromBackend);
        console.log("Total pages:", totalPagesFromBackend);

        setPagination((prev) => ({
          ...prev,
          total: totalFromBackend,
          totalPages: totalPagesFromBackend,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setError("Failed to load modules. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, filterDivision, filterAgeRange, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // =====================================================
  // SORTING FUNCTION
  // =====================================================

  const sortModules = (data, key, direction) => {
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

  async function handleAddModule(values) {
    try {
      // Parse age range
      const selectedRange = ageRangeOptions[values.division].find((range) => range.label === values.age_range);

      if (!selectedRange) {
        toast.error("Invalid age range selected");
        return;
      }

      const payload = {
        module_code: values.module_code.trim(),
        module_name: values.module_name.trim(),
        division: values.division,
        min_age: selectedRange.min,
        max_age: selectedRange.max,
      };

      const response = await createModule(payload);

      if (response.success) {
        toast.success("Module created successfully!");
        setShowAddModal(false);
        addForm.resetForm();
        await fetchModules();
      }
    } catch (err) {
      console.error("Failed to create module:", err);
      toast.error(err.response?.data?.message || "Failed to create module");
    }
  }

  // =====================================================
  // HANDLERS - EDIT
  // =====================================================

  async function handleEditModule(values) {
    try {
      if (!selectedModule) {
        toast.error("No module selected");
        return;
      }

      // Parse age range
      const selectedRange = ageRangeOptions[values.division].find((range) => range.label === values.age_range);

      if (!selectedRange) {
        toast.error("Invalid age range selected");
        return;
      }

      const payload = {
        module_code: values.module_code.trim(),
        module_name: values.module_name.trim(),
        division: values.division,
        min_age: selectedRange.min,
        max_age: selectedRange.max,
      };

      const response = await updateModule(selectedModule.id, payload);

      if (response.success) {
        toast.success("Module updated successfully!");
        setShowEditModal(false);
        setSelectedModule(null);
        editForm.resetForm();
        await fetchModules();
      }
    } catch (err) {
      console.error("Failed to update module:", err);
      toast.error(err.response?.data?.message || "Failed to update module");
    }
  }

  // =====================================================
  // HANDLERS - DELETE
  // =====================================================

  const handleDeleteModule = async (module) => {
    if (!window.confirm(`Are you sure you want to delete module "${module.module_name}"?\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      await deleteModule(module.id);
      toast.success("Module deleted successfully!");
      await fetchModules();
    } catch (err) {
      console.error("Failed to delete module:", err);
      toast.error(err.response?.data?.message || "Failed to delete module");
    }
  };

  // =====================================================
  // HANDLERS - OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (module) => {
    setSelectedModule(module);

    // Reset form first
    editForm.resetForm();

    // Construct age range label
    const ageRangeLabel = `${module.min_age}-${module.max_age}`;

    // Then set field values
    setTimeout(() => {
      editForm.setFieldValue("module_code", module.module_code);
      editForm.setFieldValue("module_name", module.module_name);
      editForm.setFieldValue("division", module.division);
      editForm.setFieldValue("age_range", ageRangeLabel);
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
    setFilterAgeRange(""); // Reset age range when division changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleAgeRangeFilterChange = (e) => {
    setFilterAgeRange(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterDivision("");
    setFilterAgeRange("");
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
  // HELPER FUNCTIONS
  // =====================================================

  const getDivisionBadge = (division) => {
    const badges = {
      JK: { label: "JK", color: "from-blue-500 to-cyan-500" },
      LK: { label: "LK", color: "from-pink-500 to-purple-500" },
    };
    return badges[division] || { label: division, color: "from-gray-500 to-gray-600" };
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading && modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Modules</h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={fetchModules} size="medium">
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
            <h1 className="text-2xl font-bold text-primary">Module Management</h1>
            <p className="text-secondary mt-1">Manage learning modules and age ranges</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Add Module
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
                placeholder="Search by module code or name..."
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

            {/* Age Range Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterAgeRange}
                onChange={handleAgeRangeFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Age Ranges</option>
                <optgroup label="Little Koders (LK)">
                  <option value="4-6">4-6</option>
                  <option value="6-8">6-8</option>
                </optgroup>
                <optgroup label="Junior Koders (JK)">
                  <option value="8-12">8-12</option>
                  <option value="12-16">12-16</option>
                </optgroup>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterDivision || filterAgeRange) && (
              <Button variant="ghost" size="medium" onClick={handleClearFilters} icon={<X className="w-4 h-4" />}>
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filterDivision || filterAgeRange) && (
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
              {filterAgeRange && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Age: {filterAgeRange}
                  <button onClick={() => setFilterAgeRange("")} className="hover:bg-primary/20 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modules Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">No Modules Found</h3>
              <p className="text-secondary text-center mb-6 max-w-md">{searchTerm ? "Try adjusting your search terms" : "Start by creating your first module"}</p>
              <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Add First Module
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Module Code */}
                    <th onClick={() => handleSort("module_code")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Code
                        <SortIcon columnKey="module_code" />
                      </div>
                    </th>

                    {/* Module Name */}
                    <th onClick={() => handleSort("module_name")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Module Name
                        <SortIcon columnKey="module_name" />
                      </div>
                    </th>

                    {/* Division */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Division</th>

                    {/* Age Range */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Age Range</th>

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
                  {modules.map((module) => {
                    const divisionBadge = getDivisionBadge(module.division);

                    return (
                      <tr key={module.id} className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                        {/* Module Code */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">{module.module_code}</span>
                          </div>
                        </td>

                        {/* Module Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary">{module.module_name}</span>
                        </td>

                        {/* Division */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${divisionBadge.color} shadow-md`}>{divisionBadge.label}</span>
                          </div>
                        </td>

                        {/* Age Range */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-primary bg-white/50 dark:bg-white/10 border border-gray-200/50 dark:border-white/10">
                              {module.min_age}-{module.max_age}
                            </span>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">{formatDate(module.created_at, DATE_FORMATS.DISPLAY)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(module)} className="p-2 rounded-lg text-primary hover:bg-white/30 dark:hover:bg-white/10 transition-colors" title="Edit module">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteModule(module)} className="p-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors" title="Delete module">
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
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} modules
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
      {/* ADD MODULE MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.resetForm();
        }}
        title="Add New Module"
        size="medium"
      >
        <form onSubmit={addForm.handleSubmit} className="space-y-4">
          {/* Module Code */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Module Code <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="module_code"
              value={addForm.values.module_code}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., JK-001, LK-SCRATCH"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.errors.module_code && <p className="text-sm text-status-error mt-1">{addForm.errors.module_code}</p>}
            <p className="text-xs text-secondary mt-1">Unique identifier for the module</p>
          </div>

          {/* Module Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Module Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="module_name"
              value={addForm.values.module_name}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., Introduction to Scratch Programming"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.errors.module_name && <p className="text-sm text-status-error mt-1">{addForm.errors.module_name}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Division <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  addForm.setFieldValue("division", "JK");
                  addForm.setFieldValue("age_range", ""); // Reset age range when division changes
                }}
                className={`p-4 rounded-xl border-2 transition-all ${addForm.values.division === "JK" ? "border-blue-500 bg-blue-500/10" : "border-gray-200 dark:border-white/10 hover:border-blue-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></span>
                  <span className="font-semibold text-primary">JK</span>
                </div>
                <p className="text-xs text-secondary">Junior Koders</p>
                <p className="text-xs text-secondary mt-1">8-16 years</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  addForm.setFieldValue("division", "LK");
                  addForm.setFieldValue("age_range", ""); // Reset age range when division changes
                }}
                className={`p-4 rounded-xl border-2 transition-all ${addForm.values.division === "LK" ? "border-pink-500 bg-pink-500/10" : "border-gray-200 dark:border-white/10 hover:border-pink-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></span>
                  <span className="font-semibold text-primary">LK</span>
                </div>
                <p className="text-xs text-secondary">Little Koders</p>
                <p className="text-xs text-secondary mt-1">4-8 years</p>
              </button>
            </div>
            {addForm.errors.division && <p className="text-sm text-status-error mt-1">{addForm.errors.division}</p>}
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Age Range <span className="text-status-error">*</span>
            </label>
            <select
              name="age_range"
              value={addForm.values.age_range}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              disabled={!addForm.values.division}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
            >
              <option value="">{addForm.values.division ? "Select age range" : "Select division first"}</option>
              {addForm.values.division &&
                ageRangeOptions[addForm.values.division].map((range) => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
            </select>
            {addForm.errors.age_range && <p className="text-sm text-status-error mt-1">{addForm.errors.age_range}</p>}
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">Module Information</p>
              <p className="text-sm text-secondary">Each module is associated with a specific division and age range to ensure appropriate content delivery.</p>
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
              Create Module
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* EDIT MODULE MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedModule(null);
          editForm.resetForm();
        }}
        title="Edit Module"
        size="medium"
      >
        <form onSubmit={editForm.handleSubmit} className="space-y-4">
          {/* Module Code */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Module Code <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="module_code"
              value={editForm.values.module_code}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="e.g., JK-001, LK-SCRATCH"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {editForm.errors.module_code && <p className="text-sm text-status-error mt-1">{editForm.errors.module_code}</p>}
          </div>

          {/* Module Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Module Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="module_name"
              value={editForm.values.module_name}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="e.g., Introduction to Scratch Programming"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {editForm.errors.module_name && <p className="text-sm text-status-error mt-1">{editForm.errors.module_name}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Division <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  editForm.setFieldValue("division", "JK");
                  editForm.setFieldValue("age_range", ""); // Reset age range when division changes
                }}
                className={`p-4 rounded-xl border-2 transition-all ${editForm.values.division === "JK" ? "border-blue-500 bg-blue-500/10" : "border-gray-200 dark:border-white/10 hover:border-blue-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></span>
                  <span className="font-semibold text-primary">JK</span>
                </div>
                <p className="text-xs text-secondary">Junior Koders</p>
                <p className="text-xs text-secondary mt-1">8-16 years</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  editForm.setFieldValue("division", "LK");
                  editForm.setFieldValue("age_range", ""); // Reset age range when division changes
                }}
                className={`p-4 rounded-xl border-2 transition-all ${editForm.values.division === "LK" ? "border-pink-500 bg-pink-500/10" : "border-gray-200 dark:border-white/10 hover:border-pink-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></span>
                  <span className="font-semibold text-primary">LK</span>
                </div>
                <p className="text-xs text-secondary">Little Koders</p>
                <p className="text-xs text-secondary mt-1">4-8 years</p>
              </button>
            </div>
            {editForm.errors.division && <p className="text-sm text-status-error mt-1">{editForm.errors.division}</p>}
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Age Range <span className="text-status-error">*</span>
            </label>
            <select
              name="age_range"
              value={editForm.values.age_range}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              disabled={!editForm.values.division}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
            >
              <option value="">{editForm.values.division ? "Select age range" : "Select division first"}</option>
              {editForm.values.division &&
                ageRangeOptions[editForm.values.division].map((range) => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
            </select>
            {editForm.errors.age_range && <p className="text-sm text-status-error mt-1">{editForm.errors.age_range}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="medium"
              onClick={() => {
                setShowEditModal(false);
                setSelectedModule(null);
                editForm.resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="medium" icon={<Check className="w-4 h-4" />} disabled={editForm.isSubmitting} loading={editForm.isSubmitting} className="flex-1">
              Update Module
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Modules;
