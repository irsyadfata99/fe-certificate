import { useEffect, useState, useCallback } from "react";
import { ENV } from "@config/env";
import {
  Plus,
  Search,
  Trash2,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  X,
  Check,
  Edit2,
  Power,
  PowerOff,
  Users,
  FileText,
  GraduationCap,
  Building2,
  Network,
} from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { useHeadBranches } from "@hooks/useBranches";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  toggleBranchStatus,
  deleteBranch,
  getBranchStats,
} from "@api/branchApi";
import { formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Branches = () => {
  // =====================================================
  // HOOKS - HEAD BRANCHES
  // =====================================================
  const { headBranches, loading: headBranchesLoading } = useHeadBranches();

  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all"); // NEW: all, head, regular

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // =====================================================
  // FORM VALIDATION - ADD BRANCH
  // =====================================================

  const addValidationSchema = {
    branch_code: {
      required: true,
      requiredMessage: "Branch code is required",
      minLength: 2,
      minLengthMessage: "Branch code must be at least 2 characters",
      maxLength: 10,
      maxLengthMessage: "Branch code must not exceed 10 characters",
      pattern: /^[A-Z0-9_-]+$/,
      patternMessage:
        "Branch code can only contain uppercase letters, numbers, dashes, and underscores",
    },
    branch_name: {
      required: true,
      requiredMessage: "Branch name is required",
      minLength: 3,
      minLengthMessage: "Branch name must be at least 3 characters",
      maxLength: 100,
      maxLengthMessage: "Branch name must not exceed 100 characters",
    },
    regional_hub: {
      validate: (value, values) => {
        // If is_head_branch is true, regional_hub must equal branch_code
        if (values.is_head_branch) {
          if (value !== values.branch_code) {
            return "Head branch must have regional_hub equal to its branch_code";
          }
        } else {
          // If not head branch, regional_hub is required
          if (!value || !value.trim()) {
            return "Regional hub is required for regular branches";
          }
        }
        return null;
      },
    },
  };

  const addForm = useForm(
    {
      branch_code: "",
      branch_name: "",
      is_head_branch: false,
      regional_hub: "",
    },
    {
      validationSchema: addValidationSchema,
      onSubmit: handleAddBranch,
    },
  );

  // =====================================================
  // FORM VALIDATION - EDIT BRANCH
  // =====================================================

  const editValidationSchema = {
    branch_name: {
      required: true,
      requiredMessage: "Branch name is required",
      minLength: 3,
      minLengthMessage: "Branch name must be at least 3 characters",
      maxLength: 100,
      maxLengthMessage: "Branch name must not exceed 100 characters",
    },
  };

  const editForm = useForm(
    {
      branch_name: "",
    },
    {
      validationSchema: editValidationSchema,
      onSubmit: handleEditBranch,
    },
  );

  // =====================================================
  // AUTO-SET REGIONAL HUB FOR HEAD BRANCH
  // =====================================================

  useEffect(() => {
    if (addForm.values.is_head_branch && addForm.values.branch_code) {
      // Auto-set regional_hub to branch_code for head branches
      addForm.setFieldValue("regional_hub", addForm.values.branch_code, false);
    } else if (
      !addForm.values.is_head_branch &&
      addForm.values.regional_hub === addForm.values.branch_code
    ) {
      // Clear regional_hub if toggling off head branch
      addForm.setFieldValue("regional_hub", "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addForm.values.is_head_branch, addForm.values.branch_code]);

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllBranches();

      if (response.success) {
        let fetchedBranches = response.data || [];

        // CLIENT-SIDE FILTERING - Search
        if (debouncedSearch.trim()) {
          const searchLower = debouncedSearch.toLowerCase().trim();
          fetchedBranches = fetchedBranches.filter((branch) => {
            const matchesCode = branch.branch_code
              .toLowerCase()
              .includes(searchLower);
            const matchesName = branch.branch_name
              .toLowerCase()
              .includes(searchLower);
            const matchesHub = branch.regional_hub
              ?.toLowerCase()
              .includes(searchLower);
            return matchesCode || matchesName || matchesHub;
          });
        }

        // CLIENT-SIDE FILTERING - Status
        if (filterStatus !== "all") {
          const isActive = filterStatus === "active";
          fetchedBranches = fetchedBranches.filter(
            (branch) => branch.is_active === isActive,
          );
        }

        // CLIENT-SIDE FILTERING - Type (NEW)
        if (filterType !== "all") {
          const isHead = filterType === "head";
          fetchedBranches = fetchedBranches.filter(
            (branch) => branch.is_head_branch === isHead,
          );
        }

        // Get total after filtering
        const totalFiltered = fetchedBranches.length;

        // Client-side sorting
        fetchedBranches = sortBranches(
          fetchedBranches,
          sortConfig.key,
          sortConfig.direction,
        );

        // CLIENT-SIDE PAGINATION
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedBranches = fetchedBranches.slice(startIndex, endIndex);

        setBranches(paginatedBranches);

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
      console.error("Failed to fetch branches:", err);
      setError("Failed to load branches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    filterStatus,
    filterType,
    sortConfig.key,
    sortConfig.direction,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      console.log(
        "🔍 Fetching branch stats from:",
        `${ENV.API_BASE_URL}/branches/stats`,
      );
      const response = await getBranchStats();
      console.log("📊 Stats Response:", response);

      if (response.success) {
        setStats(response.data);
        console.log("✅ Stats loaded successfully:", response.data);
      } else {
        console.warn("⚠️ Stats response not successful:", response);
      }
    } catch (err) {
      console.error("❌ Failed to fetch branch stats:", err);
      console.error("   Status:", err.response?.status);
      console.error("   Data:", err.response?.data);
      console.error("   Message:", err.message);

      // Don't show error toast for stats - it's not critical
      // User can still use the page without stats
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchStats();
  }, [fetchBranches, fetchStats]);

  // =====================================================
  // SORTING FUNCTION
  // =====================================================

  const sortBranches = (data, key, direction) => {
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
      } else if (typeof aVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
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

  async function handleAddBranch(values) {
    try {
      const payload = {
        branch_code: values.branch_code.trim().toUpperCase(),
        branch_name: values.branch_name.trim(),
        is_head_branch: values.is_head_branch,
        regional_hub: values.is_head_branch
          ? values.branch_code.trim().toUpperCase()
          : values.regional_hub.trim().toUpperCase(),
      };

      await createBranch(payload);

      toast.success("Branch created successfully!");
      setShowAddModal(false);
      addForm.resetForm();
      await fetchBranches();
      await fetchStats();
    } catch (err) {
      console.error("Failed to create branch:", err);
      toast.error(err.response?.data?.message || "Failed to create branch");
    }
  }

  // =====================================================
  // HANDLERS - EDIT
  // =====================================================

  async function handleEditBranch(values) {
    try {
      if (!selectedBranch) {
        toast.error("No branch selected");
        return;
      }

      const payload = {
        branch_name: values.branch_name.trim(),
      };

      await updateBranch(selectedBranch.id, payload);

      toast.success("Branch updated successfully!");
      setShowEditModal(false);
      setSelectedBranch(null);
      editForm.resetForm();
      await fetchBranches();
      await fetchStats();
    } catch (err) {
      console.error("Failed to update branch:", err);
      toast.error(err.response?.data?.message || "Failed to update branch");
    }
  }

  // =====================================================
  // HANDLERS - TOGGLE STATUS
  // =====================================================

  const handleToggleStatus = async (branch) => {
    const newStatus = !branch.is_active;
    const action = newStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} branch "${branch.branch_name}"?`,
      )
    ) {
      return;
    }

    try {
      await toggleBranchStatus(branch.id, newStatus);
      toast.success(`Branch ${action}d successfully!`);
      await fetchBranches();
      await fetchStats();
    } catch (err) {
      console.error(`Failed to ${action} branch:`, err);
      toast.error(err.response?.data?.message || `Failed to ${action} branch`);
    }
  };

  // =====================================================
  // HANDLERS - DELETE
  // =====================================================

  const handleDeleteBranch = async (branch) => {
    const warningMessage = branch.is_head_branch
      ? `Are you sure you want to delete HEAD BRANCH "${branch.branch_name}"?\n\n⚠️ WARNING: You cannot delete a head branch if it has dependent branches!\n\nThis action CANNOT be undone!`
      : `Are you sure you want to delete branch "${branch.branch_name}"?\n\nThis action CANNOT be undone!\n\nNote: Branch must have no dependencies (students, teachers, stock).`;

    if (!window.confirm(warningMessage)) {
      return;
    }

    try {
      await deleteBranch(branch.id);
      toast.success("Branch deleted successfully!");
      await fetchBranches();
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete branch:", err);
      toast.error(err.response?.data?.message || "Failed to delete branch");
    }
  };

  // =====================================================
  // HANDLERS - OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (branch) => {
    setSelectedBranch(branch);

    // Reset form first
    editForm.resetForm();

    // Set form values
    setTimeout(() => {
      editForm.setFieldValue("branch_name", branch.branch_name);
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

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleTypeFilterChange = (e) => {
    setFilterType(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
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

  const getBranchColor = (branchCode) => {
    const colors = {
      SND: "from-green-500 to-emerald-500",
      MKW: "from-purple-500 to-pink-500",
      KBP: "from-orange-500 to-red-500",
    };
    return colors[branchCode] || "from-blue-500 to-cyan-500";
  };

  const getStatForBranch = (branchId) => {
    if (!stats || !stats.branches) return null;
    return stats.branches.find((b) => b.branch_id === branchId);
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if ((loading && branches.length === 0) || headBranchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && branches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Failed to Load Branches
          </h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={fetchBranches} size="medium">
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
              Branch Management
            </h1>
            <p className="text-secondary mt-1">
              Manage branch locations, head branches, and regional hubs
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="medium"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Branch
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-primary">
                  {stats.total_students || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">
                  Total Teachers
                </p>
                <p className="text-3xl font-bold text-primary">
                  {stats.total_teachers || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">
                  Total Stock
                </p>
                <p className="text-3xl font-bold text-primary">
                  {stats.total_stock || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Search by code, name, or hub..."
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
            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterStatus}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Type Filter (NEW) */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterType}
                onChange={handleTypeFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Types</option>
                <option value="head">Head Branches Only</option>
                <option value="regular">Regular Branches Only</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
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
          {(filterStatus !== "all" || filterType !== "all") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-secondary font-medium">
                Active filters:
              </span>
              {filterStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Status: {filterStatus === "active" ? "Active" : "Inactive"}
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="hover:bg-primary/20 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                  Type: {filterType === "head" ? "Head" : "Regular"}
                  <button
                    onClick={() => setFilterType("all")}
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

      {/* Branches Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No Branches Found
              </h3>
              <p className="text-secondary text-center mb-6 max-w-md">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start by creating your first branch"}
              </p>
              <Button
                variant="primary"
                size="medium"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Add First Branch
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Branch Code */}
                    <th
                      onClick={() => handleSort("branch_code")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Code
                        <SortIcon columnKey="branch_code" />
                      </div>
                    </th>

                    {/* Branch Name */}
                    <th
                      onClick={() => handleSort("branch_name")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Branch Name
                        <SortIcon columnKey="branch_name" />
                      </div>
                    </th>

                    {/* Type (NEW) */}
                    <th
                      onClick={() => handleSort("is_head_branch")}
                      className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Type
                        <SortIcon columnKey="is_head_branch" />
                      </div>
                    </th>

                    {/* Regional Hub (NEW) */}
                    <th
                      onClick={() => handleSort("regional_hub")}
                      className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Regional Hub
                        <SortIcon columnKey="regional_hub" />
                      </div>
                    </th>

                    {/* Statistics */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      Statistics
                    </th>

                    {/* Status */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      Status
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
                  {branches.map((branch) => {
                    const branchStat = getStatForBranch(branch.id);

                    return (
                      <tr
                        key={branch.id}
                        className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                      >
                        {/* Branch Code */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg bg-gradient-to-br ${getBranchColor(branch.branch_code)} shadow-md`}
                            >
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {branch.branch_code}
                            </span>
                          </div>
                        </td>

                        {/* Branch Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary">
                            {branch.branch_name}
                          </span>
                        </td>

                        {/* Type (NEW) */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {branch.is_head_branch ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Head
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 shadow-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Regular
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Regional Hub (NEW) */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                              <Network className="w-3 h-3" />
                              {branch.regional_hub || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Statistics */}
                        <td className="px-6 py-4">
                          {branchStat ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-blue-500" />
                                  <span className="font-medium text-primary">
                                    {branchStat.students || 0}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-green-500" />
                                  <span className="font-medium text-primary">
                                    {branchStat.teachers || 0}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-purple-500" />
                                  <span className="font-medium text-primary">
                                    {branchStat.stock || 0}
                                  </span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-sm text-secondary">-</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {branch.is_active ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm flex items-center gap-1">
                                <Power className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-gray-500 to-gray-600 shadow-sm flex items-center gap-1">
                                <PowerOff className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">
                              {formatDate(
                                branch.created_at,
                                DATE_FORMATS.DISPLAY,
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(branch)}
                              className={`p-2 rounded-lg transition-colors ${
                                branch.is_active
                                  ? "text-orange-600 hover:bg-orange-500/10"
                                  : "text-green-600 hover:bg-green-500/10"
                              }`}
                              title={
                                branch.is_active
                                  ? "Deactivate branch"
                                  : "Activate branch"
                              }
                            >
                              {branch.is_active ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(branch)}
                              className="p-2 rounded-lg text-primary hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                              title="Edit branch name"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch)}
                              className="p-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors"
                              title="Delete branch"
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
              {pagination.totalPages > 1 && (
                <div className="p-6 border-t border-gray-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-secondary">
                      Showing{" "}
                      {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} branches
                    </p>
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* ADD BRANCH MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.resetForm();
        }}
        title="Add New Branch"
        size="medium"
      >
        <form onSubmit={addForm.handleSubmit} className="space-y-4">
          {/* Branch Code */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch Code <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="branch_code"
              value={addForm.values.branch_code}
              onChange={(e) => {
                // Auto-uppercase
                const uppercased = e.target.value.toUpperCase();
                addForm.handleChange({
                  target: { name: "branch_code", value: uppercased },
                });
              }}
              onBlur={addForm.handleBlur}
              placeholder="e.g., SND, MKW, KBP"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.touched.branch_code && addForm.errors.branch_code && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.branch_code}
              </p>
            )}
            <p className="text-xs text-secondary mt-1">
              Uppercase letters, numbers, dashes, and underscores only
            </p>
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="branch_name"
              value={addForm.values.branch_name}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., Sindanglaya, Margahayu"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.touched.branch_name && addForm.errors.branch_name && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.branch_name}
              </p>
            )}
          </div>

          {/* Is Head Branch Toggle (NEW) */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-sm font-semibold text-primary">
                    Head Branch
                  </span>
                  <p className="text-xs text-secondary mt-0.5">
                    Head branches can input and migrate stock
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  name="is_head_branch"
                  checked={addForm.values.is_head_branch}
                  onChange={(e) => {
                    addForm.handleChange({
                      target: {
                        name: "is_head_branch",
                        value: e.target.checked,
                        type: "checkbox",
                        checked: e.target.checked,
                      },
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>

          {/* Regional Hub (NEW) */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Regional Hub <span className="text-status-error">*</span>
            </label>
            {addForm.values.is_head_branch ? (
              <div>
                <input
                  type="text"
                  value={addForm.values.branch_code || ""}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-secondary cursor-not-allowed"
                />
                <p className="text-xs text-secondary mt-1">
                  Head branches use their own code as regional hub
                </p>
              </div>
            ) : (
              <div>
                <select
                  name="regional_hub"
                  value={addForm.values.regional_hub}
                  onChange={addForm.handleChange}
                  onBlur={addForm.handleBlur}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select regional hub...</option>
                  {headBranches.map((hub) => (
                    <option key={hub.id} value={hub.branch_code}>
                      {hub.branch_name} ({hub.branch_code})
                    </option>
                  ))}
                </select>
                {addForm.touched.regional_hub &&
                  addForm.errors.regional_hub && (
                    <p className="text-sm text-status-error mt-1">
                      {addForm.errors.regional_hub}
                    </p>
                  )}
                <p className="text-xs text-secondary mt-1">
                  Select the head branch this branch belongs to
                </p>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                Important Information
              </p>
              <ul className="text-sm text-secondary space-y-1">
                <li>• New branches are created as active by default</li>
                <li>
                  • Branch code, type, and regional hub cannot be changed after
                  creation
                </li>
                <li>
                  • Head branches can input stock and migrate to other branches
                  in their region
                </li>
                <li>
                  • Regular branches receive stock from their regional hub
                </li>
              </ul>
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
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* EDIT BRANCH MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBranch(null);
          editForm.resetForm();
        }}
        title="Edit Branch"
        size="medium"
      >
        <form onSubmit={editForm.handleSubmit} className="space-y-4">
          {/* Branch Code (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch Code
            </label>
            <input
              type="text"
              value={selectedBranch?.branch_code || ""}
              readOnly
              disabled
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-secondary cursor-not-allowed"
            />
            <p className="text-xs text-secondary mt-1">
              Branch code cannot be changed
            </p>
          </div>

          {/* Branch Type (Read-only) */}
          {selectedBranch && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Branch Type
              </label>
              <div className="flex items-center gap-2">
                {selectedBranch.is_head_branch ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Head Branch
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 shadow-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Regular Branch
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-1">
                Branch type cannot be changed
              </p>
            </div>
          )}

          {/* Regional Hub (Read-only) */}
          {selectedBranch && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Regional Hub
              </label>
              <input
                type="text"
                value={selectedBranch.regional_hub || ""}
                readOnly
                disabled
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-secondary cursor-not-allowed"
              />
              <p className="text-xs text-secondary mt-1">
                Regional hub cannot be changed
              </p>
            </div>
          )}

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="branch_name"
              value={editForm.values.branch_name}
              onChange={editForm.handleChange}
              onBlur={editForm.handleBlur}
              placeholder="e.g., Sindanglaya, Margahayu"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {editForm.touched.branch_name && editForm.errors.branch_name && (
              <p className="text-sm text-status-error mt-1">
                {editForm.errors.branch_name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="medium"
              onClick={() => {
                setShowEditModal(false);
                setSelectedBranch(null);
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
              Update Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Branches;
