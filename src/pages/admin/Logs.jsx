import { useEffect, useState, useCallback } from "react";
import { Search, Download, FileText, AlertCircle, ChevronLeft, ChevronRight, Calendar, X, Package, Users, TrendingUp, ArrowRight } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Input from "@components/common/Input";
import { useDebounce } from "@hooks/useDebounce";
import { getLogs } from "@api/logsApi";
import { exportLogs } from "@api/exportApi";
import { formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const Logs = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
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
  // DATA FETCHING
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

      const response = await getLogs(params);

      console.log("=== LOGS API RESPONSE ===");
      console.log("Full response:", response);

      if (response.success) {
        setLogs(response.data || []);

        const paginationData = response.pagination || {};
        const totalFromBackend = paginationData.total || 0;
        const totalPagesFromBackend = paginationData.totalPages || Math.ceil(totalFromBackend / pagination.pageSize) || 1;

        setPagination((prev) => ({
          ...prev,
          total: totalFromBackend,
          totalPages: totalPagesFromBackend,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to load logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, filterActionType, filterFromDate, filterToDate]);

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

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterActionType("");
    setFilterFromDate("");
    setFilterToDate("");
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
  // HANDLERS - EXPORT
  // =====================================================

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await exportLogs();
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
      SND: { label: "SND", color: "bg-blue-500" },
      MKW: { label: "MKW", color: "bg-purple-500" },
      KBP: { label: "KBP", color: "bg-pink-500" },
    };
    return badges[branch] || { label: branch, color: "bg-gray-500" };
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading && logs.length === 0) {
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
              Export Excel
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
          {(searchTerm || filterActionType || filterFromDate || filterToDate) && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="small" onClick={handleClearFilters} icon={<X className="w-4 h-4" />}>
                Clear All
              </Button>

              {/* Active Filters Display */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-secondary font-medium">Active filters:</span>
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
              <p className="text-secondary text-center mb-6 max-w-md">{searchTerm || filterActionType || filterFromDate || filterToDate ? "Try adjusting your filters" : "No activity logs available yet"}</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Certificate ID */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Certificate ID</th>

                    {/* Action Type */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Action</th>

                    {/* Description */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Description</th>

                    {/* Migration */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Migration</th>

                    {/* Amounts */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Amounts</th>

                    {/* Performed By */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Performed By</th>

                    {/* Date */}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {logs.map((log) => {
                    const actionBadge = getActionBadge(log.action_type);

                    return (
                      <tr key={log.id} className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                        {/* Certificate ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                              <Package className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">{log.certificate_id}</span>
                          </div>
                        </td>

                        {/* Action Type */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-br ${actionBadge.color} shadow-md`}>{actionBadge.label}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary line-clamp-2">{log.description || "-"}</span>
                        </td>

                        {/* Migration */}
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

                        {/* Amounts */}
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

                        {/* Performed By */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-primary">{log.performed_by || "System"}</span>
                          </div>
                        </td>

                        {/* Date */}
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

              {/* Pagination */}
              <div className="p-6 border-t border-gray-200/50 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} logs
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
    </div>
  );
};

export default Logs;
