import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  AlertCircle,
  Package,
  TrendingUp,
  ArrowRight,
  X,
  ArrowRightLeft,
} from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useConfirm } from "@hooks/useConfirm";
import { usePagination } from "@hooks/usePagination";
import { useDebounce } from "@hooks/useDebounce";
import {
  getCertificates,
  getStockSummary,
  createCertificate,
  clearAllCertificates,
  migrateCertificate,
} from "@api/certificateApi";
import { exportCertificates } from "@api/exportApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";

const Certificates = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [certificates, setCertificates] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [selectedCertForMigrate, setSelectedCertForMigrate] = useState(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Pagination
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

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
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/,
      patternMessage:
        "Certificate ID can only contain letters, numbers, dashes, and underscores",
    },
    branch: {
      required: true,
      requiredMessage: "Branch is required",
      validate: (value) => {
        if (!["SND", "MKW", "KBP"].includes(value.toUpperCase())) {
          return "Branch must be SND, MKW, or KBP";
        }
        return null;
      },
    },
    certificates_count: {
      required: true,
      requiredMessage: "Certificates count is required",
      min: 0,
      minMessage: "Certificates count cannot be negative",
      max: 10000,
      maxMessage: "Certificates count cannot exceed 10,000",
    },
    medals_count: {
      required: true,
      requiredMessage: "Medals count is required",
      min: 0,
      minMessage: "Medals count cannot be negative",
      max: 10000,
      maxMessage: "Medals count cannot exceed 10,000",
    },
  };

  const addForm = useForm(
    {
      certificate_id: "",
      branch: "",
      certificates_count: "",
      medals_count: "",
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
      validate: (value) => {
        if (!["MKW", "KBP"].includes(value.toUpperCase())) {
          return "Destination must be MKW or KBP";
        }
        return null;
      },
    },
    certificate_amount: {
      required: true,
      min: 0,
      minMessage: "Certificate amount cannot be negative",
      validate: (value) => {
        const certAmount = parseInt(value) || 0;
        const medalAmount = parseInt(migrateForm.values.medal_amount) || 0;

        if (certAmount === 0 && medalAmount === 0) {
          return "At least one amount (certificates or medals) must be greater than 0";
        }

        if (
          selectedCertForMigrate &&
          certAmount > selectedCertForMigrate.jumlah_sertifikat_snd
        ) {
          return `Cannot exceed available SND stock (${selectedCertForMigrate.jumlah_sertifikat_snd})`;
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
        const certAmount = parseInt(migrateForm.values.certificate_amount) || 0;

        if (certAmount === 0 && medalAmount === 0) {
          return "At least one amount (certificates or medals) must be greater than 0";
        }

        if (
          selectedCertForMigrate &&
          medalAmount > selectedCertForMigrate.jumlah_medali_snd
        ) {
          return `Cannot exceed available SND medals (${selectedCertForMigrate.jumlah_medali_snd})`;
        }

        return null;
      },
    },
  };

  const migrateForm = useForm(
    {
      destination_branch: "",
      certificate_amount: "0",
      medal_amount: "0",
    },
    {
      validationSchema: migrateValidationSchema,
      onSubmit: handleMigrateCertificate,
    },
  );

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        limit: pagination.pageSize,
        offset: pagination.offset,
      };

      const response = await getCertificates(params);

      if (response.success) {
        let allCertificates = response.data || [];

        // Client-side filtering
        if (debouncedSearch) {
          allCertificates = allCertificates.filter((cert) =>
            cert.certificate_id
              ?.toLowerCase()
              .includes(debouncedSearch.toLowerCase()),
          );
        }

        if (selectedBranch !== "all") {
          const branch = selectedBranch.toLowerCase();
          allCertificates = allCertificates.filter((cert) => {
            const certCount = cert[`jumlah_sertifikat_${branch}`] || 0;
            const medalCount = cert[`jumlah_medali_${branch}`] || 0;
            return certCount > 0 || medalCount > 0;
          });
        }

        setCertificates(allCertificates);
        pagination.updateTotal(
          response.pagination?.total || allCertificates.length,
        );
      }
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setError("Failed to load certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const response = await getStockSummary();

      if (response.success && response.data) {
        const stockData = response.data;

        if (stockData.total_stock) {
          setStockSummary({
            SND: stockData.total_stock.snd?.certificates || 0,
            MKW: stockData.total_stock.mkw?.certificates || 0,
            KBP: stockData.total_stock.kbp?.certificates || 0,
            total: stockData.grand_total?.certificates || 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch stock summary:", err);
    }
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    selectedBranch,
  ]);

  useEffect(() => {
    fetchStockSummary();
  }, []);

  // =====================================================
  // HANDLERS - CREATE
  // =====================================================

  async function handleAddCertificate(values) {
    try {
      const branch = values.branch.toUpperCase();

      const payload = {
        certificate_id: values.certificate_id.trim(),
        jumlah_sertifikat_snd: 0,
        jumlah_medali_snd: 0,
        jumlah_sertifikat_mkw: 0,
        jumlah_medali_mkw: 0,
        jumlah_sertifikat_kbp: 0,
        jumlah_medali_kbp: 0,
      };

      const certCount = parseInt(values.certificates_count) || 0;
      const medalCount = parseInt(values.medals_count) || 0;

      if (certCount === 0 && medalCount === 0) {
        alert(
          "At least one count (certificates or medals) must be greater than 0",
        );
        return;
      }

      if (branch === "SND") {
        payload.jumlah_sertifikat_snd = certCount;
        payload.jumlah_medali_snd = medalCount;
      } else if (branch === "MKW") {
        payload.jumlah_sertifikat_mkw = certCount;
        payload.jumlah_medali_mkw = medalCount;
      } else if (branch === "KBP") {
        payload.jumlah_sertifikat_kbp = certCount;
        payload.jumlah_medali_kbp = medalCount;
      }

      await createCertificate(payload);

      setShowAddModal(false);
      addForm.resetForm();
      fetchCertificates();
      fetchStockSummary();
    } catch (err) {
      console.error("Failed to create certificate:", err);
    }
  }

  // =====================================================
  // HANDLERS - MIGRATE
  // =====================================================

  const handleOpenMigrateModal = (certificate) => {
    // Check if has SND stock
    if (
      certificate.jumlah_sertifikat_snd === 0 &&
      certificate.jumlah_medali_snd === 0
    ) {
      alert("No SND stock available to migrate");
      return;
    }

    setSelectedCertForMigrate(certificate);
    migrateForm.resetForm();
    setShowMigrateModal(true);
  };

  async function handleMigrateCertificate(values) {
    try {
      const confirmed = await confirm.confirmWarning({
        title: "Confirm Migration",
        message: `Are you sure you want to migrate from SND to ${values.destination_branch.toUpperCase()}?\n\nCertificates: ${values.certificate_amount}\nMedals: ${values.medal_amount}`,
        confirmText: "Yes, Migrate",
        cancelText: "Cancel",
      });

      if (!confirmed) return;

      const payload = {
        certificate_id: selectedCertForMigrate.certificate_id,
        destination_branch: values.destination_branch.toLowerCase(),
        certificate_amount: parseInt(values.certificate_amount) || 0,
        medal_amount: parseInt(values.medal_amount) || 0,
      };

      await migrateCertificate(payload);

      setShowMigrateModal(false);
      setSelectedCertForMigrate(null);
      migrateForm.resetForm();
      fetchCertificates();
      fetchStockSummary();
    } catch (err) {
      console.error("Failed to migrate certificate:", err);
    }
  }

  // =====================================================
  // HANDLERS - CLEAR ALL
  // =====================================================

  const handleClearAll = async () => {
    const confirmed = await confirm.confirmDanger({
      title: "Clear All Certificates?",
      message:
        "This will permanently delete ALL certificate records. This action cannot be undone!",
      confirmText: "Yes, Clear All",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      await clearAllCertificates();
      fetchCertificates();
      fetchStockSummary();
    } catch (err) {
      console.error("Failed to clear certificates:", err);
    }
  };

  // =====================================================
  // HANDLERS - EXPORT
  // =====================================================

  const handleExport = async () => {
    try {
      await exportCertificates();
    } catch (err) {
      console.error("Failed to export certificates:", err);
    }
  };

  // =====================================================
  // HANDLERS - SEARCH & FILTER
  // =====================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    pagination.goToPage(1);
  };

  const handleBranchFilter = (branch) => {
    setSelectedBranch(branch);
    pagination.goToPage(1);
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getCertificatesByBranch = (cert) => {
    if (selectedBranch === "all") {
      return {
        certificates:
          (cert.jumlah_sertifikat_snd || 0) +
          (cert.jumlah_sertifikat_mkw || 0) +
          (cert.jumlah_sertifikat_kbp || 0),
        medals:
          (cert.jumlah_medali_snd || 0) +
          (cert.jumlah_medali_mkw || 0) +
          (cert.jumlah_medali_kbp || 0),
        branch: "ALL",
      };
    }

    const branchKey = selectedBranch.toLowerCase();
    return {
      certificates: cert[`jumlah_sertifikat_${branchKey}`] || 0,
      medals: cert[`jumlah_medali_${branchKey}`] || 0,
      branch: selectedBranch,
    };
  };

  const canMigrate = (cert) => {
    return cert.jumlah_sertifikat_snd > 0 || cert.jumlah_medali_snd > 0;
  };

  // =====================================================
  // RENDER STATS
  // =====================================================

  const statsCards = [
    {
      title: "Total Batches",
      value: formatNumber(pagination.totalItems),
      icon: Package,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Stock",
      value: formatNumber(stockSummary?.total || 0),
      icon: FileText,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "SND Stock",
      value: formatNumber(stockSummary?.SND || 0),
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

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
      {/* Header - Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Certificate Management
            </h1>
            <p className="text-secondary mt-1">
              Manage certificate batches and stock
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="medium"
              onClick={handleExport}
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search - Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              name="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by Certificate ID..."
              prefixIcon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Branch Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleBranchFilter("all")}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedBranch === "all"
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                  : "backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-primary hover:bg-white/30 dark:hover:bg-white/10"
              }`}
            >
              All
            </button>
            {["SND", "MKW", "KBP"].map((branch) => (
              <button
                key={branch}
                onClick={() => handleBranchFilter(branch)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedBranch === branch
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                    : "backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-primary hover:bg-white/30 dark:hover:bg-white/10"
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table - Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="backdrop-blur-sm bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Certificate ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Branch
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Certificates
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Medals
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-secondary" />
                      <p className="text-secondary">No certificates found</p>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setShowAddModal(true)}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Add First Batch
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                certificates.map((cert, index) => {
                  const branchData = getCertificatesByBranch(cert);
                  const canMigrateThis = canMigrate(cert);

                  return (
                    <tr
                      key={cert.id || index}
                      className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {cert.certificate_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">
                        <span className="px-2 py-1 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-medium">
                          {branchData.branch}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary">
                        {formatNumber(branchData.certificates)}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary">
                        {formatNumber(branchData.medals)}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">
                        {formatDate(cert.created_at, DATE_FORMATS.DISPLAY)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {selectedBranch === "all" && canMigrateThis && (
                          <button
                            onClick={() => handleOpenMigrateModal(cert)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-medium hover:shadow-md transition-all"
                            title="Migrate from SND"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Migrate
                          </button>
                        )}
                        {selectedBranch !== "all" &&
                          selectedBranch === "SND" &&
                          canMigrateThis && (
                            <button
                              onClick={() => handleOpenMigrateModal(cert)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-medium hover:shadow-md transition-all"
                              title="Migrate from SND"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Migrate
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200/30 dark:border-white/5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">
                {pagination.pageRangeText}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="small"
                  onClick={pagination.previousPage}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={pagination.nextPage}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
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

      {/* Add Certificate Modal */}
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
          <Input
            label="Certificate ID"
            name="certificate_id"
            {...addForm.getFieldProps("certificate_id")}
            placeholder="e.g., CERT-001"
            required
          />

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              Branch <span className="text-status-error">*</span>
            </label>
            <select
              name="branch"
              value={addForm.values.branch}
              onChange={addForm.handleChange}
              onBlur={addForm.handleBlur}
              className="w-full bg-surface text-primary border-0 rounded-lg px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-0 disabled:opacity-50"
              required
            >
              <option value="">Select Branch</option>
              <option value="SND">Sudirman (SND)</option>
              <option value="MKW">Makwana (MKW)</option>
              <option value="KBP">Kopo Permai (KBP)</option>
            </select>
            {addForm.getError("branch") && (
              <p className="mt-1.5 text-sm text-status-error">
                {addForm.getError("branch")}
              </p>
            )}
          </div>

          <Input
            label="Certificates Count"
            name="certificates_count"
            type="number"
            {...addForm.getFieldProps("certificates_count")}
            placeholder="0"
            required
          />

          <Input
            label="Medals Count"
            name="medals_count"
            type="number"
            {...addForm.getFieldProps("medals_count")}
            placeholder="0"
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setShowAddModal(false);
                addForm.resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={addForm.isSubmitting}
              disabled={addForm.isSubmitting}
            >
              Add Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Migrate Certificate Modal */}
      <Modal
        isOpen={showMigrateModal}
        onClose={() => {
          setShowMigrateModal(false);
          setSelectedCertForMigrate(null);
          migrateForm.resetForm();
        }}
        title="Migrate Certificate Stock"
        size="medium"
      >
        {selectedCertForMigrate && (
          <div className="space-y-4">
            {/* Certificate Info */}
            <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-4 border border-gray-200/30 dark:border-white/5">
              <p className="text-sm font-medium text-primary mb-2">
                Certificate ID:{" "}
                <span className="font-bold">
                  {selectedCertForMigrate.certificate_id}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-secondary">SND Certificates:</p>
                  <p className="text-primary font-semibold">
                    {formatNumber(
                      selectedCertForMigrate.jumlah_sertifikat_snd || 0,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-secondary">SND Medals:</p>
                  <p className="text-primary font-semibold">
                    {formatNumber(
                      selectedCertForMigrate.jumlah_medali_snd || 0,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={migrateForm.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Destination Branch{" "}
                  <span className="text-status-error">*</span>
                </label>
                <select
                  name="destination_branch"
                  value={migrateForm.values.destination_branch}
                  onChange={migrateForm.handleChange}
                  onBlur={migrateForm.handleBlur}
                  className="w-full bg-surface text-primary border-0 rounded-lg px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-0"
                  required
                >
                  <option value="">Select Destination</option>
                  <option value="MKW">Makwana (MKW)</option>
                  <option value="KBP">Kopo Permai (KBP)</option>
                </select>
                {migrateForm.getError("destination_branch") && (
                  <p className="mt-1.5 text-sm text-status-error">
                    {migrateForm.getError("destination_branch")}
                  </p>
                )}
              </div>

              <Input
                label="Certificate Amount to Migrate"
                name="certificate_amount"
                type="number"
                {...migrateForm.getFieldProps("certificate_amount")}
                placeholder="0"
                helperText={`Available: ${formatNumber(selectedCertForMigrate.jumlah_sertifikat_snd || 0)}`}
                required
              />

              <Input
                label="Medal Amount to Migrate"
                name="medal_amount"
                type="number"
                {...migrateForm.getFieldProps("medal_amount")}
                placeholder="0"
                helperText={`Available: ${formatNumber(selectedCertForMigrate.jumlah_medali_snd || 0)}`}
                required
              />

              <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 rounded-xl p-3 border border-gray-200/30 dark:border-white/5">
                <p className="text-xs text-secondary">
                  ⚠️ At least one amount (certificates or medals) must be
                  greater than 0
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowMigrateModal(false);
                    setSelectedCertForMigrate(null);
                    migrateForm.resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={migrateForm.isSubmitting}
                  disabled={migrateForm.isSubmitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Migrate
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certificates;
