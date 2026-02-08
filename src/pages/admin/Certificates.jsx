import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  AlertCircle,
  Package,
  TrendingUp,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  History,
  X,
  Check,
  Eye,
} from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useConfirm } from "@hooks/useConfirm";
import { useDebounce } from "@hooks/useDebounce";
import {
  getCertificates,
  getStockSummary,
  createCertificate,
  migrateCertificate,
  clearAllCertificates,
  getTransactionHistory,
  getCertificateById,
} from "@api/certificateApi";
import { exportCertificates } from "@api/exportApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS, LOG_ACTION_LABELS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Certificates = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [certificates, setCertificates] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
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

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce search (500ms delay)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Confirmation dialog
  const confirm = useConfirm();

  // =====================================================
  // FORM VALIDATION - ADD CERTIFICATE
  // =====================================================

  const addValidationSchema = {
    certificate_id: {
      required: true,
      requiredMessage: "Certificate ID is required",
      minLength: 3,
      minLengthMessage: "Certificate ID must be at least 3 characters",
      maxLength: 50,
      maxLengthMessage: "Certificate ID must not exceed 50 characters",
      pattern: /^[A-Za-z0-9_-]+$/,
      patternMessage:
        "Certificate ID can only contain letters, numbers, dashes, and underscores",
    },
  };

  const addForm = useForm(
    {
      certificate_id: "",
      jumlah_sertifikat_snd: "",
      jumlah_medali_snd: "",
      jumlah_sertifikat_mkw: "",
      jumlah_medali_mkw: "",
      jumlah_sertifikat_kbp: "",
      jumlah_medali_kbp: "",
    },
    {
      validationSchema: addValidationSchema,
      onSubmit: handleAddCertificate,
    },
  );

  // =====================================================
  // FORM VALIDATION - MIGRATE CERTIFICATE
  // =====================================================

  const migrateValidationSchema = {
    destination_branch: {
      required: true,
      requiredMessage: "Destination branch is required",
    },
    certificate_amount: {
      required: true,
      min: 0,
      minMessage: "Certificate amount cannot be negative",
      validate: (value) => {
        const certAmount = parseInt(value) || 0;
        const medalAmount = parseInt(migrateForm.values.medal_amount) || 0;

        if (certAmount === 0 && medalAmount === 0) {
          return "At least one amount must be greater than 0";
        }

        if (
          selectedCertificate &&
          certAmount > selectedCertificate.jumlah_sertifikat_snd
        ) {
          return `Cannot exceed available SND stock (${selectedCertificate.jumlah_sertifikat_snd})`;
        }

        return null;
      },
    },
    medal_amount: {
      required: true,
      min: 0,
      minMessage: "Medal amount cannot be negative",
      validate: (value) => {
        const medalAmount = parseInt(value) || 0;

        if (
          selectedCertificate &&
          medalAmount > selectedCertificate.jumlah_medali_snd
        ) {
          return `Cannot exceed available SND medals (${selectedCertificate.jumlah_medali_snd})`;
        }

        return null;
      },
    },
  };

  const migrateForm = useForm(
    {
      destination_branch: "MKW",
      certificate_amount: "",
      medal_amount: "",
    },
    {
      validationSchema: migrateValidationSchema,
      onSubmit: handleMigrateCertificate,
    },
  );

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (pagination.currentPage - 1) * pagination.pageSize;

      // Build query parameters for server-side filtering
      const params = {
        limit: pagination.pageSize,
        offset,
      };

      // Add search if exists
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Add date filters if exist
      if (dateFilter.fromDate) {
        params.from_date = dateFilter.fromDate;
      }
      if (dateFilter.toDate) {
        params.to_date = dateFilter.toDate;
      }

      const response = await getCertificates(params);

      if (response.success) {
        let fetchedCertificates = response.data || [];

        // Client-side branch filter only (untuk display purposes)
        // Tidak menghilangkan data, hanya untuk highlighting
        setCertificates(fetchedCertificates);

        // Update pagination with correct total from backend
        const totalFromBackend = response.pagination?.total || 0;
        setPagination((prev) => ({
          ...prev,
          total: totalFromBackend,
          totalPages: Math.ceil(totalFromBackend / prev.pageSize) || 1,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setError("Failed to load certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    dateFilter.fromDate,
    dateFilter.toDate,
  ]);

  const fetchStockSummary = useCallback(async () => {
    try {
      const response = await getStockSummary();

      if (response.success && response.data) {
        const stockData = response.data;

        if (stockData.total_stock) {
          setStockSummary({
            snd: {
              certificates: stockData.total_stock.snd?.certificates || 0,
              medals: stockData.total_stock.snd?.medals || 0,
            },
            mkw: {
              certificates: stockData.total_stock.mkw?.certificates || 0,
              medals: stockData.total_stock.mkw?.medals || 0,
            },
            kbp: {
              certificates: stockData.total_stock.kbp?.certificates || 0,
              medals: stockData.total_stock.kbp?.medals || 0,
            },
            grandTotal: {
              certificates: stockData.grand_total?.certificates || 0,
              medals: stockData.grand_total?.medals || 0,
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch stock summary:", err);
    }
  }, []);

  const fetchTransactionHistory = useCallback(async (certificateId = null) => {
    setHistoryLoading(true);

    try {
      const params = {
        limit: 50,
        offset: 0,
      };

      if (certificateId) {
        params.certificate_id = certificateId;
      }

      const response = await getTransactionHistory(params);

      if (response.success) {
        setHistoryData(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      toast.error("Failed to load transaction history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchCertificateDetail = useCallback(async (certificateId) => {
    setDetailLoading(true);

    try {
      const response = await getCertificateById(certificateId);

      if (response.success) {
        setDetailData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch certificate detail:", err);
      toast.error("Failed to load certificate details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    fetchStockSummary();
  }, [fetchStockSummary]);

  // =====================================================
  // HANDLERS - CREATE
  // =====================================================

  async function handleAddCertificate(values) {
    try {
      const payload = {
        certificate_id: values.certificate_id.trim(),
        jumlah_sertifikat_snd: parseInt(values.jumlah_sertifikat_snd) || 0,
        jumlah_medali_snd: parseInt(values.jumlah_medali_snd) || 0,
        jumlah_sertifikat_mkw: parseInt(values.jumlah_sertifikat_mkw) || 0,
        jumlah_medali_mkw: parseInt(values.jumlah_medali_mkw) || 0,
        jumlah_sertifikat_kbp: parseInt(values.jumlah_sertifikat_kbp) || 0,
        jumlah_medali_kbp: parseInt(values.jumlah_medali_kbp) || 0,
      };

      // Validate at least one value > 0
      const totalInput =
        payload.jumlah_sertifikat_snd +
        payload.jumlah_medali_snd +
        payload.jumlah_sertifikat_mkw +
        payload.jumlah_medali_mkw +
        payload.jumlah_sertifikat_kbp +
        payload.jumlah_medali_kbp;

      if (totalInput === 0) {
        toast.error(
          "At least one certificate or medal count must be greater than 0",
        );
        return;
      }

      await createCertificate(payload);

      setShowAddModal(false);
      addForm.resetForm();
      await fetchCertificates();
      await fetchStockSummary();
    } catch (err) {
      console.error("Failed to create certificate:", err);
      // Error toast handled by API layer
    }
  }

  // =====================================================
  // HANDLERS - MIGRATE
  // =====================================================

  const handleOpenMigrateModal = (certificate) => {
    if (
      certificate.jumlah_sertifikat_snd === 0 &&
      certificate.jumlah_medali_snd === 0
    ) {
      toast.error("No SND stock available to migrate");
      return;
    }

    setSelectedCertificate(certificate);
    migrateForm.resetForm();
    setShowMigrateModal(true);
  };

  async function handleMigrateCertificate(values) {
    try {
      const confirmed = await confirm.confirmWarning({
        title: "Confirm Migration",
        message: `Migrate from SND to ${values.destination_branch.toUpperCase()}?\n\nCertificates: ${values.certificate_amount}\nMedals: ${values.medal_amount}`,
        confirmText: "Yes, Migrate",
        cancelText: "Cancel",
      });

      if (!confirmed) return;

      const payload = {
        certificate_id: selectedCertificate.certificate_id,
        destination_branch: values.destination_branch.toLowerCase(),
        certificate_amount: parseInt(values.certificate_amount) || 0,
        medal_amount: parseInt(values.medal_amount) || 0,
      };

      await migrateCertificate(payload);

      setShowMigrateModal(false);
      setSelectedCertificate(null);
      migrateForm.resetForm();
      await fetchCertificates();
      await fetchStockSummary();
    } catch (err) {
      console.error("Failed to migrate certificate:", err);
      // Error toast handled by API layer
    }
  }

  // =====================================================
  // HANDLERS - CLEAR ALL
  // =====================================================

  const handleClearAll = async () => {
    const confirmed = await confirm.confirmDanger({
      title: "Clear All Certificates?",
      message:
        "This will permanently delete ALL certificate batches. This action cannot be undone!",
      confirmText: "Yes, Clear All",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      await clearAllCertificates();
      await fetchCertificates();
      await fetchStockSummary();
    } catch (err) {
      console.error("Failed to clear certificates:", err);
      // Error toast handled by API layer
    }
  };

  // =====================================================
  // HANDLERS - EXPORT
  // =====================================================

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportCertificates();
    } catch (err) {
      console.error("Failed to export certificates:", err);
      // Error toast handled by API layer
    } finally {
      setExporting(false);
    }
  };

  // =====================================================
  // HANDLERS - HISTORY
  // =====================================================

  const handleViewHistory = async (certificate = null) => {
    setShowHistoryModal(true);
    await fetchTransactionHistory(certificate?.certificate_id);
  };

  // =====================================================
  // HANDLERS - DETAIL
  // =====================================================

  const handleViewDetail = async (certificate) => {
    setShowDetailModal(true);
    setDetailData(certificate); // Use existing data first
    await fetchCertificateDetail(certificate.certificate_id);
  };

  // =====================================================
  // HANDLERS - SEARCH & FILTER
  // =====================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleBranchFilter = (branch) => {
    setSelectedBranch(branch);
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedBranch("all");
    setDateFilter({ fromDate: "", toDate: "" });
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
  // COMPUTED VALUES
  // =====================================================

  // Filtered certificates for display (client-side branch highlighting only)
  const displayCertificates = useMemo(() => {
    if (selectedBranch === "all") {
      return certificates;
    }

    // Don't filter out, just return all for now
    // Branch filter is just for visual highlighting
    return certificates;
  }, [certificates, selectedBranch]);

  // Get branch data for table display
  const getBranchData = useCallback(
    (cert) => {
      if (selectedBranch === "all") {
        return {
          snd: {
            certificates: cert.jumlah_sertifikat_snd || 0,
            medals: cert.jumlah_medali_snd || 0,
          },
          mkw: {
            certificates: cert.jumlah_sertifikat_mkw || 0,
            medals: cert.jumlah_medali_mkw || 0,
          },
          kbp: {
            certificates: cert.jumlah_sertifikat_kbp || 0,
            medals: cert.jumlah_medali_kbp || 0,
          },
        };
      }

      const branch = selectedBranch.toLowerCase();
      return {
        certificates: cert[`jumlah_sertifikat_${branch}`] || 0,
        medals: cert[`jumlah_medali_${branch}`] || 0,
      };
    },
    [selectedBranch],
  );

  // Check if can migrate
  const canMigrate = useCallback((cert) => {
    return cert.jumlah_sertifikat_snd > 0 || cert.jumlah_medali_snd > 0;
  }, []);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedBranch !== "all") count++;
    if (dateFilter.fromDate || dateFilter.toDate) count++;
    return count;
  }, [searchTerm, selectedBranch, dateFilter]);

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading && certificates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && certificates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Failed to Load Certificates
          </h3>
          <p className="text-secondary mb-4">{error}</p>
          <Button variant="primary" onClick={fetchCertificates} size="medium">
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
              Certificate Management
            </h1>
            <p className="text-secondary mt-1">
              Manage certificate batches and stock distribution
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="medium"
              icon={<History className="w-4 h-4" />}
              onClick={() => handleViewHistory()}
            >
              History
            </Button>
            <Button
              variant="outline"
              size="medium"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
              loading={exporting}
              disabled={exporting}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="medium"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                name="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by Certificate ID..."
                prefixIcon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Date Filters */}
            <div className="flex gap-2">
              <Input
                type="date"
                name="fromDate"
                value={dateFilter.fromDate}
                onChange={(e) =>
                  handleDateFilterChange("fromDate", e.target.value)
                }
                placeholder="From Date"
                prefixIcon={<Calendar className="w-5 h-5" />}
              />
              <Input
                type="date"
                name="toDate"
                value={dateFilter.toDate}
                onChange={(e) =>
                  handleDateFilterChange("toDate", e.target.value)
                }
                placeholder="To Date"
                prefixIcon={<Calendar className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Branch Filter & Clear */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => handleBranchFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBranch === "all"
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                    : "backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-primary hover:bg-white/30 dark:hover:bg-white/10"
                }`}
              >
                All Branches
              </button>
              {["SND", "MKW", "KBP"].map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleBranchFilter(branch)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedBranch === branch
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                      : "backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-primary hover:bg-white/30 dark:hover:bg-white/10"
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="small"
                onClick={handleClearFilters}
                icon={<X className="w-4 h-4" />}
              >
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {displayCertificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No Certificate Batches Found
              </h3>
              <p className="text-secondary text-center mb-6 max-w-md">
                {searchTerm || dateFilter.fromDate || dateFilter.toDate
                  ? "Try adjusting your filters or search terms"
                  : "Start by creating your first certificate batch"}
              </p>
              <Button
                variant="primary"
                size="medium"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Add First Batch
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">
                      Certificate ID
                    </th>
                    {selectedBranch === "all" ? (
                      <>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                          SND
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                          MKW
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                          KBP
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                          Certificates
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                          Medals
                        </th>
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {displayCertificates.map((cert) => {
                    const branchData = getBranchData(cert);
                    const canMigrateThis = canMigrate(cert);

                    return (
                      <tr
                        key={cert.id}
                        className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <button
                                onClick={() => handleViewDetail(cert)}
                                className="text-sm font-semibold text-primary hover:text-blue-600 transition-colors"
                              >
                                {cert.certificate_id}
                              </button>
                            </div>
                          </div>
                        </td>

                        {selectedBranch === "all" ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <p className="text-sm font-semibold text-primary">
                                  {formatNumber(branchData.snd.certificates)}
                                </p>
                                <p className="text-xs text-secondary">
                                  {formatNumber(branchData.snd.medals)} medals
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <p className="text-sm font-semibold text-primary">
                                  {formatNumber(branchData.mkw.certificates)}
                                </p>
                                <p className="text-xs text-secondary">
                                  {formatNumber(branchData.mkw.medals)} medals
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <p className="text-sm font-semibold text-primary">
                                  {formatNumber(branchData.kbp.certificates)}
                                </p>
                                <p className="text-xs text-secondary">
                                  {formatNumber(branchData.kbp.medals)} medals
                                </p>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-center">
                              <p className="text-sm font-semibold text-primary">
                                {formatNumber(branchData.certificates)}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="text-sm font-semibold text-primary">
                                {formatNumber(branchData.medals)}
                              </p>
                            </td>
                          </>
                        )}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">
                              {formatDate(
                                cert.created_at,
                                DATE_FORMATS.DISPLAY,
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(cert)}
                              className="p-2 rounded-lg backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-primary hover:bg-white/30 dark:hover:bg-white/10 transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canMigrateThis && (
                              <button
                                onClick={() => handleOpenMigrateModal(cert)}
                                className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white hover:shadow-md transition-all"
                                title="Migrate from SND"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
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
                      of {formatNumber(pagination.total)} batches
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
                                  className={`min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    page === pagination.currentPage
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-white/30 dark:hover:bg-white/5"
                                  }`}
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

      {/* Danger Zone */}
      {certificates.length > 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-status-error/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-status-error mb-1">
                Danger Zone
              </h3>
              <p className="text-sm text-secondary">
                Permanently delete all certificate records
              </p>
            </div>
            <Button
              variant="danger"
              size="medium"
              onClick={handleClearAll}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODALS */}
      {/* ===================================================== */}

      {/* Add Certificate Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.resetForm();
        }}
        title="Add Certificate Batch"
        size="large"
      >
        <form onSubmit={addForm.handleSubmit} className="space-y-4">
          {/* Certificate ID */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Batch ID <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              name="certificate_id"
              value={addForm.values.certificate_id}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              placeholder="e.g., BATCH-2026-001"
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {addForm.errors.certificate_id && (
              <p className="text-sm text-status-error mt-1">
                {addForm.errors.certificate_id}
              </p>
            )}
          </div>

          {/* SND Section */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
              SND (Sudirman)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Certificates
                </label>
                <input
                  type="number"
                  name="jumlah_sertifikat_snd"
                  value={addForm.values.jumlah_sertifikat_snd}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Medals
                </label>
                <input
                  type="number"
                  name="jumlah_medali_snd"
                  value={addForm.values.jumlah_medali_snd}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* MKW Section */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
              MKW (Makwana)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Certificates
                </label>
                <input
                  type="number"
                  name="jumlah_sertifikat_mkw"
                  value={addForm.values.jumlah_sertifikat_mkw}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Medals
                </label>
                <input
                  type="number"
                  name="jumlah_medali_mkw"
                  value={addForm.values.jumlah_medali_mkw}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* KBP Section */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
              KBP (Kopo Permai)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Certificates
                </label>
                <input
                  type="number"
                  name="jumlah_sertifikat_kbp"
                  value={addForm.values.jumlah_sertifikat_kbp}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Medals
                </label>
                <input
                  type="number"
                  name="jumlah_medali_kbp"
                  value={addForm.values.jumlah_medali_kbp}
                  onChange={addForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary">
              At least one certificate or medal must be greater than 0
            </p>
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
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Migrate Certificate Modal */}
      <Modal
        isOpen={showMigrateModal}
        onClose={() => {
          setShowMigrateModal(false);
          setSelectedCertificate(null);
          migrateForm.resetForm();
        }}
        title="Migrate Certificate Stock"
        size="medium"
      >
        {selectedCertificate && (
          <form onSubmit={migrateForm.handleSubmit} className="space-y-4">
            {/* Batch Info */}
            <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
              <p className="text-sm text-secondary mb-1">Batch ID</p>
              <p className="text-lg font-semibold text-primary">
                {selectedCertificate.certificate_id}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-white/5">
                <p className="text-sm text-secondary mb-2">Available in SND:</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(
                        selectedCertificate.jumlah_sertifikat_snd || 0,
                      )}
                    </p>
                    <p className="text-xs text-secondary">Certificates</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(selectedCertificate.jumlah_medali_snd || 0)}
                    </p>
                    <p className="text-xs text-secondary">Medals</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Branch */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Destination Branch <span className="text-status-error">*</span>
              </label>
              <select
                name="destination_branch"
                value={migrateForm.values.destination_branch}
                onChange={migrateForm.handleChange}
                className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="MKW">MKW (Makwana)</option>
                <option value="KBP">KBP (Kopo Permai)</option>
              </select>
            </div>

            {/* Migration Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Certificates to Migrate
                </label>
                <input
                  type="number"
                  name="certificate_amount"
                  value={migrateForm.values.certificate_amount}
                  onChange={migrateForm.handleChange}
                  min="0"
                  max={selectedCertificate.jumlah_sertifikat_snd || 0}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {migrateForm.errors.certificate_amount && (
                  <p className="text-sm text-status-error mt-1">
                    {migrateForm.errors.certificate_amount}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Medals to Migrate
                </label>
                <input
                  type="number"
                  name="medal_amount"
                  value={migrateForm.values.medal_amount}
                  onChange={migrateForm.handleChange}
                  min="0"
                  max={selectedCertificate.jumlah_medali_snd || 0}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {migrateForm.errors.medal_amount && (
                  <p className="text-sm text-status-error mt-1">
                    {migrateForm.errors.medal_amount}
                  </p>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-secondary">
                Migration will deduct from SND stock and add to the destination
                branch. This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="medium"
                onClick={() => {
                  setShowMigrateModal(false);
                  setSelectedCertificate(null);
                  migrateForm.resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="medium"
                icon={<ArrowRightLeft className="w-4 h-4" />}
                disabled={migrateForm.isSubmitting}
                loading={migrateForm.isSubmitting}
                className="flex-1"
              >
                Migrate
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryData([]);
        }}
        title="Transaction History"
        size="xlarge"
      >
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="large" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-secondary mx-auto mb-4" />
              <p className="text-secondary">No transaction history found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData.map((log, index) => (
                <div
                  key={index}
                  className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-medium">
                          {LOG_ACTION_LABELS[log.action_type] ||
                            log.action_type}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {log.certificate_id}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-secondary mt-1">
                          {log.details}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-secondary">
                        <span>By: {log.performed_by || "System"}</span>
                        <span>•</span>
                        <span>
                          {formatDate(
                            log.created_at,
                            DATE_FORMATS.DISPLAY_WITH_TIME,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Certificate Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailData(null);
        }}
        title="Certificate Details"
        size="large"
      >
        {detailLoading && !detailData ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : detailData ? (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
              <h3 className="text-lg font-semibold text-primary mb-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary">Certificate ID</p>
                  <p className="text-base font-semibold text-primary mt-1">
                    {detailData.certificate_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Created At</p>
                  <p className="text-base font-semibold text-primary mt-1">
                    {formatDate(
                      detailData.created_at,
                      DATE_FORMATS.DISPLAY_WITH_TIME,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock by Branch */}
            <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
              <h3 className="text-lg font-semibold text-primary mb-3">
                Stock by Branch
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {/* SND */}
                <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
                    <p className="text-sm font-semibold text-primary">SND</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-secondary">Certificates</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_sertifikat_snd || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Medals</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_medali_snd || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MKW */}
                <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
                    <p className="text-sm font-semibold text-primary">MKW</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-secondary">Certificates</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_sertifikat_mkw || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Medals</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_medali_mkw || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KBP */}
                <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
                    <p className="text-sm font-semibold text-primary">KBP</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-secondary">Certificates</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_sertifikat_kbp || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Medals</p>
                      <p className="text-xl font-bold text-primary">
                        {formatNumber(detailData.jumlah_medali_kbp || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="medium"
                onClick={() => handleViewHistory(detailData)}
                icon={<History className="w-4 h-4" />}
                className="flex-1"
              >
                View History
              </Button>
              {canMigrate(detailData) && (
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenMigrateModal(detailData);
                  }}
                  icon={<ArrowRightLeft className="w-4 h-4" />}
                  className="flex-1"
                >
                  Migrate Stock
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
            <p className="text-secondary">Failed to load certificate details</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certificates;
