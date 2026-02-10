import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Download, FileText, AlertCircle, ChevronLeft, ChevronRight, Calendar, X, Package, Users, TrendingUp, ArrowRight, Building2 } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Input from "@components/common/Input";
import { useDebounce } from "@hooks/useDebounce";
import { useHeadBranches } from "@hooks/useBranches";
import { getLogs } from "@api/logsApi";
import { exportLogs } from "@api/exportApi";
import { formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const Logs = () => {
  // =====================================================
  // HOOKS - HEAD BRANCHES
  // =====================================================
  const { headBranches, loading: headBranchesLoading } = useHeadBranches();

  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Selected regional hub for filtering
  const [selectedRegionalHub, setSelectedRegionalHub] = useState("");

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
  const [filterActionType, setFilterActionType] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  // =====================================================
  // ACTION TYPE OPTIONS
  // =====================================================
  const actionTypes = [
    { value: "CREATE", label: "Create", color: "from-green-500 to-emerald-500" },
    { value: "MIGRATE", label: "Migrate", color: "from-purple-500 to-pink-500" },
  ];

  // =====================================================
  // DYNAMIC BRANCH COLOR GENERATOR
  // =====================================================
  const generateBranchColors = useMemo(() => {
    const predefinedColors = {
      SND: {
        gradient: "from-green-500 to-emerald-500",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500",
        bg: "bg-green-500/10",
      },
      BSD: {
        gradient: "from-blue-500 to-cyan-500",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500",
        bg: "bg-blue-500/10",
      },
      PIK: {
        gradient: "from-purple-500 to-pink-500",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500",
        bg: "bg-purple-500/10",
      },
      MKW: {
        gradient: "from-orange-500 to-red-500",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500",
        bg: "bg-orange-500/10",
      },
      KBP: {
        gradient: "from-yellow-500 to-amber-500",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-500",
        bg: "bg-yellow-500/10",
      },
    };

    return predefinedColors;
  }, []);

  const getBranchColor = (branchCode) => {
    return generateBranchColors[branchCode]?.gradient || "from-gray-500 to-slate-500";
  };

  const getBranchTextColor = (branchCode) => {
    return generateBranchColors[branchCode]?.text || "text-gray-600 dark:text-gray-400";
  };

  const getBranchBorderColor = (branchCode) => {
    return generateBranchColors[branchCode]?.border || "border-gray-500";
  };

  const getBranchBgColor = (branchCode) => {
    return generateBranchColors[branchCode]?.bg || "bg-gray-500/10";
  };

  // =====================================================
  // DATA FETCHING - IMPROVED WITH BETTER DEBUGGING
  // =====================================================

  const fetchLogs = useCallback(async () => {
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

      // Add action type filter if selected
      if (filterActionType) {
        params.action_type = filterActionType;
      }

      // Add date range filters if selected
      if (filterFromDate) {
        params.from_date = filterFromDate;
      }

      if (filterToDate) {
        params.to_date = filterToDate;
      }

      // Add regional hub filter if selected
      if (selectedRegionalHub) {
        params.regional_hub = selectedRegionalHub;
      }

      console.log("📤 Fetching logs with params:", params);

      const response = await getLogs(params);

      console.log("📥 LOGS API RESPONSE:");
      console.log("  - Success:", response.success);
      console.log("  - Data count:", response.data?.length);
      console.log("  - Has meta:", !!response.meta);
      console.log("  - Has pagination (direct):", !!response.pagination);
      console.log("  - Meta.pagination:", response.meta?.pagination);
      console.log("  - Full response:", response);

      if (response.success) {
        const logsData = response.data || [];
        setLogs(logsData);

        // UNIVERSAL PAGINATION HANDLER - handles ALL response structures!
        // Try multiple possible locations for pagination data
        let paginationData = null;

        // Option 1: response.pagination (standard)
        if (response.pagination) {
          paginationData = response.pagination;
          console.log("✅ Found pagination at: response.pagination");
        }
        // Option 2: response.meta.pagination (like Modules API)
        else if (response.meta?.pagination) {
          paginationData = response.meta.pagination;
          console.log("✅ Found pagination at: response.meta.pagination");
        }
        // Option 3: response.meta (direct)
        else if (response.meta) {
          paginationData = response.meta;
          console.log("⚠️ Using response.meta as fallback");
        }
        // Option 4: Create from data length
        else {
          console.warn("⚠️ No pagination data found - calculating from data");
          paginationData = {
            total: logsData.length,
            totalPages: logsData.length > 0 ? 1 : 0,
          };
        }

        // Extract values with multiple fallback options
        const totalFromBackend = Number(paginationData.total ?? paginationData.count ?? logsData.length ?? 0);

        // Calculate total pages with fallback
        const calculatedTotalPages = totalFromBackend > 0 ? Math.ceil(totalFromBackend / pagination.pageSize) : logsData.length > 0 ? 1 : 0; // If we have data but no total, assume 1 page

        const totalPagesFromBackend = Number(paginationData.totalPages ?? paginationData.total_pages ?? calculatedTotalPages);

        console.log("📊 Pagination Processing:");
        console.log("  - Raw pagination data:", paginationData);
        console.log("  - Total records:", totalFromBackend);
        console.log("  - Page size:", pagination.pageSize);
        console.log("  - Total pages (backend):", paginationData.totalPages);
        console.log("  - Total pages (calculated):", calculatedTotalPages);
        console.log("  - Total pages (FINAL):", totalPagesFromBackend);
        console.log("  - Current page:", pagination.currentPage);
        console.log("  - Logs displayed:", logsData.length);

        setPagination((prev) => ({
          ...prev,
          total: totalFromBackend,
          totalPages: totalPagesFromBackend,
        }));

        // Diagnostic warnings
        if (!response.pagination && !response.meta) {
          console.error("🔴 CRITICAL: No pagination data in response at all!");
        }
      } else {
        console.error("❌ API returned success: false");
        setError("Failed to load logs");
      }
    } catch (err) {
      console.error("❌ Failed to fetch logs:", err);
      setError("Failed to load logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, filterActionType, filterFromDate, filterToDate, selectedRegionalHub]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  const handleActionTypeFilterChange = (e) => {
    setFilterActionType(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFromDateChange = (e) => {
    setFilterFromDate(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleToDateChange = (e) => {
    setFilterToDate(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRegionalHubChange = (hubCode) => {
    setSelectedRegionalHub(hubCode);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterActionType("");
    setFilterFromDate("");
    setFilterToDate("");
    setSelectedRegionalHub("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // =====================================================
  // HANDLERS - PAGINATION
  // =====================================================

  const handlePageChange = (newPage) => {
    console.log(`🔄 Page change requested: ${pagination.currentPage} → ${newPage}`);
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    } else {
      console.warn(`⚠️ Invalid page number: ${newPage} (valid range: 1-${pagination.totalPages})`);
    }
  };

  // =====================================================
  // HANDLERS - EXPORT
  // =====================================================

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      // Pass regional hub filter to export
      await exportLogs({ regional_hub: selectedRegionalHub });
    } catch (err) {
      console.error("Failed to export logs:", err);
    } finally {
      setExporting(false);
    }
  };

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const getActionBadge = (actionType) => {
    const action = actionTypes.find((a) => a.value === actionType);
    return action || { label: actionType, color: "from-gray-500 to-gray-600" };
  };

  const getBranchBadge = (branch) => {
    const badges = {
      SND: { label: "SND", color: "bg-green-500" },
      BSD: { label: "BSD", color: "bg-blue-500" },
      PIK: { label: "PIK", color: "bg-purple-500" },
      MKW: { label: "MKW", color: "bg-orange-500" },
      KBP: { label: "KBP", color: "bg-yellow-500" },
    };
    return badges[branch] || { label: branch, color: "bg-gray-500" };
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if ((loading && logs.length === 0) || headBranchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Logs</h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={fetchLogs} size="medium">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGINATION INFO (for debugging)
  // =====================================================
  const showPaginationDebug = process.env.NODE_ENV === "development";

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Certificate Logs</h1>
            <p className="text-secondary mt-1">Track all certificate and medal transactions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="medium" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel} disabled={exporting} loading={exporting}>
              Export Excel {selectedRegionalHub && `(${selectedRegionalHub})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Regional Hub Filter */}
      {headBranches.length > 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <label className="text-sm font-semibold text-primary">Filter by Regional Hub:</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* All option */}
              <button
                onClick={() => handleRegionalHubChange("")}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${selectedRegionalHub === "" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 dark:border-white/10 text-secondary hover:border-primary/50"}`}
              >
                <span className="font-semibold">All Hubs</span>
              </button>

              {/* Head branches */}
              {headBranches.map((branch) => (
                <button
                  key={branch.branch_code}
                  onClick={() => handleRegionalHubChange(branch.branch_code)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    selectedRegionalHub === branch.branch_code
                      ? `${getBranchBorderColor(branch.branch_code)} ${getBranchBgColor(branch.branch_code)} ${getBranchTextColor(branch.branch_code)}`
                      : "border-gray-200 dark:border-white/10 text-secondary hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${getBranchColor(branch.branch_code)}`}></span>
                    <span className="font-semibold">{branch.branch_code}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {selectedRegionalHub && <p className="text-xs text-secondary mt-2 ml-7">Showing logs for {headBranches.find((b) => b.branch_code === selectedRegionalHub)?.branch_name} regional hub</p>}
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
                placeholder="Search by certificate ID or description..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action Type Filter */}
            <div>
              <select
                value={filterActionType}
                onChange={handleActionTypeFilterChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Actions</option>
                {actionTypes.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date Filter */}
            <div>
              <input
                type="date"
                value={filterFromDate}
                onChange={handleFromDateChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="From date"
              />
            </div>

            {/* To Date Filter */}
            <div>
              <input
                type="date"
                value={filterToDate}
                onChange={handleToDateChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="To date"
              />
            </div>
          </div>

          {/* Clear Filters Button & Active Filters Display */}
          {(searchTerm || filterActionType || filterFromDate || filterToDate || selectedRegionalHub) && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="small" onClick={handleClearFilters} icon={<X className="w-4 h-4" />}>
                Clear All
              </Button>

              {/* Active Filters Display */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-secondary font-medium">Active filters:</span>
                {selectedRegionalHub && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    Hub: {selectedRegionalHub}
                    <button onClick={() => setSelectedRegionalHub("")} className="hover:bg-primary/20 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterActionType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    Action: {actionTypes.find((a) => a.value === filterActionType)?.label}
                    <button onClick={() => setFilterActionType("")} className="hover:bg-primary/20 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterFromDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    From: {filterFromDate}
                    <button onClick={() => setFilterFromDate("")} className="hover:bg-primary/20 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterToDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    To: {filterToDate}
                    <button onClick={() => setFilterToDate("")} className="hover:bg-primary/20 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">No Logs Found</h3>
              <p className="text-secondary text-center mb-6 max-w-md">{searchTerm || filterActionType || filterFromDate || filterToDate || selectedRegionalHub ? "Try adjusting your filters" : "No activity logs available yet"}</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Certificate ID</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Description</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Migration</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Amounts</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Performed By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {logs.map((log) => {
                    const actionBadge = getActionBadge(log.action_type);

                    return (
                      <tr key={log.id} className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                              <Package className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">{log.certificate_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${actionBadge.color} shadow-md`}>{actionBadge.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary line-clamp-2">{log.description || "-"}</span>
                        </td>
                        <td className="px-6 py-4">
                          {log.from_branch && log.to_branch ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getBranchBadge(log.from_branch).color}`}>{getBranchBadge(log.from_branch).label}</span>
                              <ArrowRight className="w-4 h-4 text-secondary" />
                              <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getBranchBadge(log.to_branch).color}`}>{getBranchBadge(log.to_branch).label}</span>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <span className="text-sm text-secondary">-</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            {log.certificate_amount > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-medium text-primary">{log.certificate_amount} cert</span>
                              </div>
                            )}
                            {log.medal_amount > 0 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-medium text-primary">{log.medal_amount} medal</span>
                              </div>
                            )}
                            {log.certificate_amount === 0 && log.medal_amount === 0 && <span className="text-sm text-secondary">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-primary">{log.performed_by || "System"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">{formatDate(log.created_at, DATE_FORMATS.DISPLAY)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* IMPROVED: Pagination - Always show if totalPages >= 1 */}
              {pagination.total > 0 && (
                <div className="p-6 border-t border-gray-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Results info */}
                    <p className="text-sm text-secondary">
                      Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} logs
                    </p>

                    {/* Pagination controls - show even if only 1 page */}
                    {pagination.totalPages >= 1 && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="small" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: pagination.totalPages }, (_, i) => {
                            const page = i + 1;
                            // Show first page, last page, current page, and pages around current
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
