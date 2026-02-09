import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, FileText, AlertCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, X, Check, ArrowRightLeft } from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { getCertificates, createCertificate, clearAllCertificates, migrateCertificate } from "@api/certificateApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Certificates = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [certificates, setCertificates] = useState([]);
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

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);

  // =====================================================
  // FORM VALIDATION - ADD CERTIFICATE (SND ONLY)
  // =====================================================

  const addValidationSchema = {
    certificate_id: {
      required: true,
      requiredMessage: "Batch ID is required",
      minLength: 3,
      minLengthMessage: "Batch ID must be at least 3 characters",
      maxLength: 50,
      maxLengthMessage: "Batch ID must not exceed 50 characters",
      pattern: /^[A-Za-z0-9_-]+$/,
      patternMessage: "Batch ID can only contain letters, numbers, dashes, and underscores",
    },
  };

  const addForm = useForm(
    {
      certificate_id: "",
      jumlah_sertifikat_snd: "",
      jumlah_medali_snd: "",
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
    certificate_id: {
      required: true,
      requiredMessage: "Batch ID is required",
    },
    destination_branch: {
      required: true,
      requiredMessage: "Destination branch is required",
    },
  };

  const migrateForm = useForm(
    {
      certificate_id: "",
      destination_branch: "",
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

      const params = {
        limit: pagination.pageSize,
        offset,
      };

      // Add search param if exists
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await getCertificates(params);

      console.log("=== CERTIFICATES API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      console.log("Response meta:", response.meta);
      console.log("Response meta.pagination:", response.meta?.pagination);

      if (response.success) {
        let fetchedCertificates = response.data || [];

        // Client-side sorting only (backend handles filtering)
        fetchedCertificates = sortCertificates(fetchedCertificates, sortConfig.key, sortConfig.direction);

        setCertificates(fetchedCertificates);

        // FIX: Backend sends pagination data in response.meta.pagination (sama seperti Modules)
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
      console.error("Failed to fetch certificates:", err);
      setError("Failed to load certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // =====================================================
  // SORTING FUNCTION
  // =====================================================

  const sortCertificates = (data, key, direction) => {
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
      } else if (typeof aVal === "number") {
        aVal = aVal || 0;
        bVal = bVal || 0;
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
  // HANDLERS - CREATE (SND ONLY)
  // =====================================================

  async function handleAddCertificate(values) {
    try {
      const payload = {
        certificate_id: values.certificate_id.trim(),
        jumlah_sertifikat_snd: parseInt(values.jumlah_sertifikat_snd) || 0,
        jumlah_medali_snd: parseInt(values.jumlah_medali_snd) || 0,
        // MKW and KBP are always 0 for new batches
        jumlah_sertifikat_mkw: 0,
        jumlah_medali_mkw: 0,
        jumlah_sertifikat_kbp: 0,
        jumlah_medali_kbp: 0,
      };

      const totalInput = payload.jumlah_sertifikat_snd + payload.jumlah_medali_snd;

      if (totalInput === 0) {
        toast.error("At least one certificate or medal must be greater than 0");
        return;
      }

      await createCertificate(payload);

      setShowAddModal(false);
      addForm.resetForm();
      await fetchCertificates();
    } catch (err) {
      console.error("Failed to create certificate:", err);
    }
  }

  // =====================================================
  // HANDLERS - MIGRATE
  // =====================================================

  async function handleMigrateCertificate(values) {
    try {
      const certAmount = parseInt(values.certificate_amount) || 0;
      const medalAmount = parseInt(values.medal_amount) || 0;

      if (certAmount === 0 && medalAmount === 0) {
        toast.error("At least one certificate or medal amount must be greater than 0");
        return;
      }

      // Find the certificate to validate stock
      const cert = certificates.find((c) => c.certificate_id === values.certificate_id);
      if (!cert) {
        toast.error("Certificate batch not found");
        return;
      }

      // Validate SND stock
      if (certAmount > (cert.jumlah_sertifikat_snd || 0)) {
        toast.error(`Insufficient SND certificates. Available: ${cert.jumlah_sertifikat_snd || 0}`);
        return;
      }

      if (medalAmount > (cert.jumlah_medali_snd || 0)) {
        toast.error(`Insufficient SND medals. Available: ${cert.jumlah_medali_snd || 0}`);
        return;
      }

      const payload = {
        certificate_id: values.certificate_id.trim(),
        destination_branch: values.destination_branch.toLowerCase(),
        certificate_amount: certAmount,
        medal_amount: medalAmount,
      };

      await migrateCertificate(payload);

      setShowMigrateModal(false);
      migrateForm.resetForm();
      await fetchCertificates();
    } catch (err) {
      console.error("Failed to migrate certificate:", err);
    }
  }

  // =====================================================
  // HANDLERS - CLEAR ALL
  // =====================================================

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear ALL certificate batches?\n\nThis action CANNOT be undone!")) {
      return;
    }

    if (!window.confirm("FINAL WARNING: This will permanently delete ALL certificate records.\n\nType 'DELETE' in the next prompt to confirm.")) {
      return;
    }

    const confirmation = window.prompt('Type "DELETE" (in capital letters) to confirm:');

    if (confirmation !== "DELETE") {
      toast.error("Clear all cancelled - confirmation text did not match");
      return;
    }

    try {
      await clearAllCertificates();
      await fetchCertificates();
    } catch (err) {
      console.error("Failed to clear certificates:", err);
    }
  };

  // =====================================================
  // HANDLERS - SEARCH
  // =====================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearSearch = () => {
    setSearchTerm("");
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

  const getBatchTotal = (cert) => {
    const totalCert = (cert.jumlah_sertifikat_snd || 0) + (cert.jumlah_sertifikat_mkw || 0) + (cert.jumlah_sertifikat_kbp || 0);
    const totalMedal = (cert.jumlah_medali_snd || 0) + (cert.jumlah_medali_mkw || 0) + (cert.jumlah_medali_kbp || 0);
    return { certificates: totalCert, medals: totalMedal };
  };

  // Get available batches for migration (those with SND stock)
  const availableBatchesForMigration = certificates.filter((cert) => cert.jumlah_sertifikat_snd > 0 || cert.jumlah_medali_snd > 0);

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
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Certificates</h3>
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
            <h1 className="text-2xl font-bold text-primary">Certificate Management</h1>
            <p className="text-secondary mt-1">Manage certificate batches and stock distribution</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="medium" icon={<ArrowRightLeft className="w-4 h-4" />} onClick={() => setShowMigrateModal(true)}>
              Migrate Stock
            </Button>
            <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              name="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by Batch ID..."
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
      </div>

      {/* Certificates Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">No Certificate Batches Found</h3>
              <p className="text-secondary text-center mb-6 max-w-md">{searchTerm ? "Try adjusting your search terms" : "Start by creating your first certificate batch"}</p>
              <Button variant="primary" size="medium" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Add First Batch
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    {/* Batch ID */}
                    <th onClick={() => handleSort("certificate_id")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Batch ID
                        <SortIcon columnKey="certificate_id" />
                      </div>
                    </th>

                    {/* SND */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
                        SND
                      </div>
                    </th>

                    {/* MKW */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
                        MKW
                      </div>
                    </th>

                    {/* KBP */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
                        KBP
                      </div>
                    </th>

                    {/* Total Batch */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Total Batch</th>

                    {/* Cumulative Total */}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">Cumulative</th>

                    {/* Created */}
                    <th onClick={() => handleSort("created_at")} className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon columnKey="created_at" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {certificates.map((cert) => {
                    const batchTotal = getBatchTotal(cert);

                    return (
                      <tr key={cert.id} className="hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                        {/* Batch ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-primary">{cert.certificate_id}</span>
                          </div>
                        </td>

                        {/* SND */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">{formatNumber(cert.jumlah_sertifikat_snd || 0)} certs</p>
                            <p className="text-xs text-secondary">{formatNumber(cert.jumlah_medali_snd || 0)} medals</p>
                          </div>
                        </td>

                        {/* MKW */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">{formatNumber(cert.jumlah_sertifikat_mkw || 0)} certs</p>
                            <p className="text-xs text-secondary">{formatNumber(cert.jumlah_medali_mkw || 0)} medals</p>
                          </div>
                        </td>

                        {/* KBP */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">{formatNumber(cert.jumlah_sertifikat_kbp || 0)} certs</p>
                            <p className="text-xs text-secondary">{formatNumber(cert.jumlah_medali_kbp || 0)} medals</p>
                          </div>
                        </td>

                        {/* Total Batch */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">{formatNumber(batchTotal.certificates)} certs</p>
                            <p className="text-xs text-secondary">{formatNumber(batchTotal.medals)} medals</p>
                          </div>
                        </td>

                        {/* Cumulative Total */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">{formatNumber(cert.cumulative_total_cert || 0)} certs</p>
                            <p className="text-xs text-secondary">{formatNumber(cert.cumulative_total_medal || 0)} medals</p>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">{formatDate(cert.created_at, DATE_FORMATS.DISPLAY)}</span>
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
                      Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {formatNumber(pagination.total)} batches
                    </p>
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
              <h3 className="text-lg font-semibold text-status-error mb-1">Danger Zone</h3>
              <p className="text-sm text-secondary">Permanently delete all certificate records</p>
            </div>
            <Button variant="danger" size="medium" onClick={handleClearAll} icon={<Trash2 className="w-4 h-4" />}>
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* ADD CERTIFICATE MODAL (SND ONLY) */}
      {/* ===================================================== */}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.resetForm();
        }}
        title="Add Certificate Batch"
        size="medium"
      >
        <form onSubmit={addForm.handleSubmit} className="space-y-4">
          {/* Batch ID */}
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
            {addForm.errors.certificate_id && <p className="text-sm text-status-error mt-1">{addForm.errors.certificate_id}</p>}
          </div>

          {/* SND Section */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></span>
              SND (Sunda) - Initial Stock
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">Certificates</label>
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
                <label className="block text-sm text-secondary mb-1">Medals</label>
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

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">Stock Distribution Info</p>
              <p className="text-sm text-secondary">New batches are added to SND only. Use "Migrate Stock" to transfer certificates and medals to MKW or KBP branches.</p>
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
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* MIGRATE CERTIFICATE MODAL */}
      {/* ===================================================== */}

      <Modal
        isOpen={showMigrateModal}
        onClose={() => {
          setShowMigrateModal(false);
          migrateForm.resetForm();
        }}
        title="Migrate Stock from SND"
        size="medium"
      >
        <form onSubmit={migrateForm.handleSubmit} className="space-y-4">
          {/* Select Batch */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Select Batch <span className="text-status-error">*</span>
            </label>
            <select
              name="certificate_id"
              value={migrateForm.values.certificate_id}
              onChange={migrateForm.handleChange}
              onBlur={migrateForm.handleBlur}
              className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Choose a batch...
              </option>
              {availableBatchesForMigration.map((cert) => (
                <option key={cert.id} value={cert.certificate_id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {cert.certificate_id} - SND: {cert.jumlah_sertifikat_snd || 0} certs, {cert.jumlah_medali_snd || 0} medals
                </option>
              ))}
            </select>
            {migrateForm.errors.certificate_id && <p className="text-sm text-status-error mt-1">{migrateForm.errors.certificate_id}</p>}
          </div>

          {/* Destination Branch */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Destination Branch <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => migrateForm.setFieldValue("destination_branch", "mkw")}
                className={`p-4 rounded-xl border-2 transition-all ${migrateForm.values.destination_branch === "mkw" ? "border-purple-500 bg-purple-500/10" : "border-gray-200 dark:border-white/10 hover:border-purple-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></span>
                  <span className="font-semibold text-primary">MKW</span>
                </div>
                <p className="text-xs text-secondary">Mekarwangi</p>
              </button>

              <button
                type="button"
                onClick={() => migrateForm.setFieldValue("destination_branch", "kbp")}
                className={`p-4 rounded-xl border-2 transition-all ${migrateForm.values.destination_branch === "kbp" ? "border-orange-500 bg-orange-500/10" : "border-gray-200 dark:border-white/10 hover:border-orange-500/50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></span>
                  <span className="font-semibold text-primary">KBP</span>
                </div>
                <p className="text-xs text-secondary">Kota Baru Parahyangan</p>
              </button>
            </div>
            {migrateForm.errors.destination_branch && <p className="text-sm text-status-error mt-1">{migrateForm.errors.destination_branch}</p>}
          </div>

          {/* Migration Amount */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3">Migration Amount</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">Certificates</label>
                <input
                  type="number"
                  name="certificate_amount"
                  value={migrateForm.values.certificate_amount}
                  onChange={migrateForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">Medals</label>
                <input
                  type="number"
                  name="medal_amount"
                  value={migrateForm.values.medal_amount}
                  onChange={migrateForm.handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Current Stock Display */}
          {migrateForm.values.certificate_id && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-primary font-medium mb-1">Available SND Stock</p>
                <p className="text-sm text-secondary">
                  {(() => {
                    const cert = certificates.find((c) => c.certificate_id === migrateForm.values.certificate_id);
                    if (!cert) return "Batch not found";
                    return `${cert.jumlah_sertifikat_snd || 0} certificates, ${cert.jumlah_medali_snd || 0} medals`;
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">Migration Rules</p>
              <ul className="text-sm text-secondary space-y-1">
                <li>• Stock is transferred from SND to the selected branch</li>
                <li>• At least one certificate or medal must be migrated</li>
                <li>• Cannot exceed available SND stock</li>
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
                setShowMigrateModal(false);
                migrateForm.resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="medium" icon={<ArrowRightLeft className="w-4 h-4" />} disabled={migrateForm.isSubmitting} loading={migrateForm.isSubmitting} className="flex-1">
              Migrate Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Certificates;
