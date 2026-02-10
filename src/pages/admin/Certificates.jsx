import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  X,
  Check,
  ArrowRightLeft,
  Building2,
} from "lucide-react";
import Button from "@components/common/Button";
import Spinner from "@components/common/Spinner";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import { useForm } from "@hooks/useForm";
import { useDebounce } from "@hooks/useDebounce";
import { useHeadBranches, useBranches } from "@hooks/useBranches";
import {
  getCertificates,
  createCertificate,
  clearAllCertificates,
  migrateCertificate,
} from "@api/certificateApi";
import { formatNumber, formatDate } from "@utils/formatters";
import { DATE_FORMATS } from "@utils/constants";
import { toast } from "react-hot-toast";

const Certificates = () => {
  // =====================================================
  // HOOKS - HEAD BRANCHES & ALL BRANCHES
  // =====================================================
  const {
    headBranches,
    loading: headBranchesLoading,
    error: headBranchesError,
  } = useHeadBranches();
  const {
    branches: allBranches,
    loading: allBranchesLoading,
    error: allBranchesError,
  } = useBranches();

  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected head branch for operations
  const [selectedHeadBranch, setSelectedHeadBranch] = useState(null);

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
  // AUTO-SELECT FIRST HEAD BRANCH
  // =====================================================
  useEffect(() => {
    if (headBranches.length > 0 && !selectedHeadBranch) {
      setSelectedHeadBranch(headBranches[0]);
    }
  }, [headBranches, selectedHeadBranch]);

  // =====================================================
  // RESET TO PAGE 1 WHEN HEAD BRANCH CHANGES
  // =====================================================
  useEffect(() => {
    if (selectedHeadBranch) {
      console.log(
        `🔄 Head branch changed to: ${selectedHeadBranch.branch_code}`,
      );
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        total: 0,
        totalPages: 0,
      }));
      setCertificates([]);
    }
  }, [selectedHeadBranch?.branch_code]);

  // =====================================================
  // GET DESTINATION BRANCHES (same regional hub)
  // =====================================================
  const destinationBranches = useMemo(() => {
    if (!selectedHeadBranch || !allBranches.length) return [];

    return allBranches.filter((branch) => {
      return (
        branch.regional_hub === selectedHeadBranch.branch_code &&
        branch.branch_code !== selectedHeadBranch.branch_code &&
        !branch.is_head_branch &&
        branch.is_active
      );
    });
  }, [selectedHeadBranch, allBranches]);

  // =====================================================
  // FORM VALIDATION - ADD CERTIFICATE (HEAD BRANCH ONLY)
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
      patternMessage:
        "Batch ID can only contain letters, numbers, dashes, and underscores",
    },
  };

  const addForm = useForm(
    {
      certificate_id: "",
      jumlah_sertifikat: "",
      jumlah_medali: "",
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
  // DATA FETCHING (WITH REGIONAL HUB FILTER)
  // =====================================================

  const fetchCertificates = useCallback(async () => {
    if (!selectedHeadBranch?.branch_code) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = (pagination.currentPage - 1) * pagination.pageSize;

      const params = {
        limit: pagination.pageSize,
        offset,
        regional_hub: selectedHeadBranch.branch_code,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      console.log("📡 Fetching certificates:", params);

      const response = await getCertificates(params);

      if (response.success) {
        let fetchedCertificates = response.data || [];

        // Client-side sorting
        fetchedCertificates = sortCertificates(
          fetchedCertificates,
          sortConfig.key,
          sortConfig.direction,
        );

        // ✅ FIXED: Calculate cumulative from NEWEST to OLDEST
        fetchedCertificates = calculateCumulativeTotals(fetchedCertificates);

        setCertificates(fetchedCertificates);

        const paginationData = response.meta?.pagination || {};
        const totalFromBackend = paginationData.total || 0;
        const totalPagesFromBackend =
          paginationData.totalPages ||
          Math.ceil(totalFromBackend / pagination.pageSize) ||
          1;

        console.log("📊 Pagination:", {
          total: totalFromBackend,
          totalPages: totalPagesFromBackend,
          currentPage: pagination.currentPage,
          regional_hub: selectedHeadBranch.branch_code,
        });

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
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    sortConfig.key,
    sortConfig.direction,
    selectedHeadBranch?.branch_code,
  ]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // =====================================================
  // CALCULATE CUMULATIVE TOTALS - SHOW GRAND TOTAL AT TOP
  // =====================================================

  const calculateCumulativeTotals = (certificateList) => {
    // First, calculate grand total from ALL batches
    let grandTotalCerts = 0;
    let grandTotalMedals = 0;

    certificateList.forEach((cert) => {
      const stockByBranch = cert.stock_by_branch || [];
      const batchCerts = stockByBranch.reduce(
        (sum, stock) => sum + (stock.certificates || 0),
        0,
      );
      const batchMedals = stockByBranch.reduce(
        (sum, stock) => sum + (stock.medals || 0),
        0,
      );

      grandTotalCerts += batchCerts;
      grandTotalMedals += batchMedals;
    });

    // Then, assign cumulative starting from grand total (newest) to 0 (oldest)
    let remainingCerts = grandTotalCerts;
    let remainingMedals = grandTotalMedals;

    return certificateList.map((cert) => {
      const stockByBranch = cert.stock_by_branch || [];

      // Calculate total for this batch
      const batchCerts = stockByBranch.reduce(
        (sum, stock) => sum + (stock.certificates || 0),
        0,
      );
      const batchMedals = stockByBranch.reduce(
        (sum, stock) => sum + (stock.medals || 0),
        0,
      );

      // Assign current cumulative (remaining total including this batch)
      const cumulativeCerts = remainingCerts;
      const cumulativeMedals = remainingMedals;

      // Subtract this batch from remaining
      remainingCerts -= batchCerts;
      remainingMedals -= batchMedals;

      return {
        ...cert,
        cumulative_total_cert: cumulativeCerts,
        cumulative_total_medal: cumulativeMedals,
      };
    });
  };

  // =====================================================
  // SORTING FUNCTION
  // =====================================================

  const sortCertificates = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

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
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // =====================================================
  // HANDLERS - CREATE (HEAD BRANCH ONLY)
  // =====================================================

  async function handleAddCertificate(values) {
    try {
      if (!selectedHeadBranch) {
        toast.error("Please select a head branch first");
        return;
      }

      const payload = {
        certificate_id: values.certificate_id.trim(),
        jumlah_sertifikat: parseInt(values.jumlah_sertifikat) || 0,
        jumlah_medali: parseInt(values.jumlah_medali) || 0,
        branch_code: selectedHeadBranch.branch_code,
      };

      const totalInput = payload.jumlah_sertifikat + payload.jumlah_medali;

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
        toast.error(
          "At least one certificate or medal amount must be greater than 0",
        );
        return;
      }

      const cert = certificates.find(
        (c) => c.certificate_id === values.certificate_id,
      );
      if (!cert) {
        toast.error("Certificate batch not found");
        return;
      }

      const headStock = cert.stock_by_branch?.find(
        (s) => s.branch_code === selectedHeadBranch?.branch_code,
      );
      const availableCerts = headStock?.certificates || 0;
      const availableMedals = headStock?.medals || 0;

      if (certAmount > availableCerts) {
        toast.error(
          `Insufficient ${selectedHeadBranch?.branch_name} certificates. Available: ${availableCerts}`,
        );
        return;
      }

      if (medalAmount > availableMedals) {
        toast.error(
          `Insufficient ${selectedHeadBranch?.branch_name} medals. Available: ${availableMedals}`,
        );
        return;
      }

      const payload = {
        certificate_id: values.certificate_id.trim(),
        destination_branch: values.destination_branch,
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
    if (
      !window.confirm(
        "Are you sure you want to clear ALL certificate batches?\n\nThis action CANNOT be undone!",
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        "FINAL WARNING: This will permanently delete ALL certificate records.\n\nType 'DELETE' in the next prompt to confirm.",
      )
    ) {
      return;
    }

    const confirmation = window.prompt(
      'Type "DELETE" (in capital letters) to confirm:',
    );

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
  // HANDLERS - HEAD BRANCH SELECTION
  // =====================================================

  const handleHeadBranchChange = (branchCode) => {
    const branch = headBranches.find((b) => b.branch_code === branchCode);
    setSelectedHeadBranch(branch);
  };

  // =====================================================
  // REORDER BRANCHES: HEAD BRANCH + SUB-BRANCHES (DYNAMIC)
  // =====================================================
  const getOrderedBranches = () => {
    if (!selectedHeadBranch || !allBranches.length) return [];

    const regionalBranches = allBranches.filter(
      (branch) =>
        branch.regional_hub === selectedHeadBranch.branch_code &&
        branch.is_active,
    );

    return regionalBranches.sort((a, b) => {
      if (a.is_head_branch && !b.is_head_branch) return -1;
      if (!a.is_head_branch && b.is_head_branch) return 1;
      return a.branch_code.localeCompare(b.branch_code);
    });
  };

  const orderedBranches = getOrderedBranches();

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

    const additionalColors = [
      {
        gradient: "from-indigo-500 to-violet-500",
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-indigo-500",
        bg: "bg-indigo-500/10",
      },
      {
        gradient: "from-rose-500 to-pink-500",
        text: "text-rose-600 dark:text-rose-400",
        border: "border-rose-500",
        bg: "bg-rose-500/10",
      },
      {
        gradient: "from-teal-500 to-cyan-500",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-500",
        bg: "bg-teal-500/10",
      },
      {
        gradient: "from-lime-500 to-green-500",
        text: "text-lime-600 dark:text-lime-400",
        border: "border-lime-500",
        bg: "bg-lime-500/10",
      },
      {
        gradient: "from-fuchsia-500 to-purple-500",
        text: "text-fuchsia-600 dark:text-fuchsia-400",
        border: "border-fuchsia-500",
        bg: "bg-fuchsia-500/10",
      },
    ];

    const colorMap = {};
    let additionalColorIndex = 0;

    allBranches.forEach((branch) => {
      if (predefinedColors[branch.branch_code]) {
        colorMap[branch.branch_code] = predefinedColors[branch.branch_code];
      } else {
        colorMap[branch.branch_code] =
          additionalColors[additionalColorIndex % additionalColors.length];
        additionalColorIndex++;
      }
    });

    return colorMap;
  }, [allBranches]);

  const getBranchColor = (branchCode) => {
    return (
      generateBranchColors[branchCode]?.gradient || "from-gray-500 to-slate-500"
    );
  };

  const getBranchTextColor = (branchCode) => {
    return (
      generateBranchColors[branchCode]?.text ||
      "text-gray-600 dark:text-gray-400"
    );
  };

  const getBranchBorderColor = (branchCode) => {
    return generateBranchColors[branchCode]?.border || "border-gray-500";
  };

  const getBranchBgColor = (branchCode) => {
    return generateBranchColors[branchCode]?.bg || "bg-gray-500/10";
  };

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const getBatchTotal = (cert) => {
    const stockByBranch = cert.stock_by_branch || [];
    const totalCert = stockByBranch.reduce(
      (sum, stock) => sum + (stock.certificates || 0),
      0,
    );
    const totalMedal = stockByBranch.reduce(
      (sum, stock) => sum + (stock.medals || 0),
      0,
    );
    return { certificates: totalCert, medals: totalMedal };
  };

  const getBranchStock = (cert, branchCode) => {
    const stock = cert.stock_by_branch?.find(
      (s) => s.branch_code === branchCode,
    );
    return {
      certificates: stock?.certificates || 0,
      medals: stock?.medals || 0,
    };
  };

  const availableBatchesForMigration = certificates.filter((cert) => {
    const headStock = cert.stock_by_branch?.find(
      (s) => s.branch_code === selectedHeadBranch?.branch_code,
    );
    return (headStock?.certificates || 0) > 0 || (headStock?.medals || 0) > 0;
  });

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (
    (loading && certificates.length === 0) ||
    headBranchesLoading ||
    allBranchesLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (
    (error && certificates.length === 0) ||
    headBranchesError ||
    allBranchesError
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-status-error/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Failed to Load Data
          </h3>
          <p className="text-secondary mb-4">
            {error || headBranchesError || allBranchesError}
          </p>
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
              Manage certificate batches and stock distribution across branches
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="medium"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              onClick={() => setShowMigrateModal(true)}
              disabled={
                !selectedHeadBranch || availableBatchesForMigration.length === 0
              }
            >
              Migrate Stock
            </Button>
            <Button
              variant="primary"
              size="medium"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
              disabled={!selectedHeadBranch}
            >
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Head Branch Selection */}
      {headBranches.length > 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <label className="text-sm font-semibold text-primary">
                Operating Branch:
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {headBranches.map((branch) => (
                <button
                  key={branch.branch_code}
                  onClick={() => handleHeadBranchChange(branch.branch_code)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    selectedHeadBranch?.branch_code === branch.branch_code
                      ? `${getBranchBorderColor(branch.branch_code)} ${getBranchBgColor(branch.branch_code)} ${getBranchTextColor(branch.branch_code)}`
                      : "border-gray-200 dark:border-white/10 text-secondary hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${getBranchColor(branch.branch_code)}`}
                    ></span>
                    <span className="font-semibold">{branch.branch_code}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {selectedHeadBranch && (
            <p className="text-xs text-secondary mt-2 ml-7">
              Managing stock for {selectedHeadBranch.branch_name} regional hub
            </p>
          )}
        </div>
      )}

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
      </div>

      {/* Certificates Table */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No Certificate Batches Found
              </h3>
              <p className="text-secondary text-center mb-6 max-w-md">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : `No batches found for ${selectedHeadBranch?.branch_name} regional hub`}
              </p>
              <Button
                variant="primary"
                size="medium"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
                disabled={!selectedHeadBranch}
              >
                Add First Batch
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-white/20 dark:bg-white/5 border-b border-gray-200/30 dark:border-white/5">
                  <tr>
                    <th
                      onClick={() => handleSort("certificate_id")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Batch ID
                        <SortIcon columnKey="certificate_id" />
                      </div>
                    </th>

                    {orderedBranches.map((branch) => (
                      <th
                        key={branch.branch_code}
                        className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full bg-gradient-to-br ${getBranchColor(branch.branch_code)}`}
                          ></span>
                          {branch.branch_code}
                        </div>
                      </th>
                    ))}

                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary uppercase">
                      STOCK REMAINING
                    </th>

                    <th
                      onClick={() => handleSort("created_at")}
                      className="px-6 py-4 text-left text-sm font-semibold text-primary uppercase cursor-pointer select-none hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon columnKey="created_at" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/5">
                  {certificates.map((cert) => {
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
                            <span className="text-sm font-semibold text-primary">
                              {cert.certificate_id}
                            </span>
                          </div>
                        </td>

                        {orderedBranches.map((branch) => {
                          const stock = getBranchStock(
                            cert,
                            branch.branch_code,
                          );
                          return (
                            <td key={branch.branch_code} className="px-6 py-4">
                              <div className="text-center">
                                <p className="text-sm font-semibold text-primary">
                                  {formatNumber(stock.certificates)} certs
                                </p>
                                <p className="text-xs text-secondary">
                                  {formatNumber(stock.medals)} medals
                                </p>
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Batch - CUMULATIVE (NEWEST FIRST) */}
                        <td className="px-6 py-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">
                              {formatNumber(cert.cumulative_total_cert || 0)}{" "}
                              certs
                            </p>
                            <p className="text-xs text-secondary">
                              {formatNumber(cert.cumulative_total_medal || 0)}{" "}
                              medals
                            </p>
                          </div>
                        </td>

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

      {/* ADD MODAL */}
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
            {addForm.touched.certificate_id &&
              addForm.errors.certificate_id && (
                <p className="text-sm text-status-error mt-1">
                  {addForm.errors.certificate_id}
                </p>
              )}
          </div>

          {selectedHeadBranch && (
            <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${getBranchColor(selectedHeadBranch.branch_code)}`}
                ></span>
                {selectedHeadBranch.branch_code} - Initial Stock
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-secondary mb-1">
                    Certificates
                  </label>
                  <input
                    type="number"
                    name="jumlah_sertifikat"
                    value={addForm.values.jumlah_sertifikat}
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
                    name="jumlah_medali"
                    value={addForm.values.jumlah_medali}
                    onChange={addForm.handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                Stock Distribution Info
              </p>
              <p className="text-sm text-secondary">
                New batches are added to {selectedHeadBranch?.branch_code} only.
                Use "Migrate Stock" to transfer certificates and medals to other
                branches in the same regional hub.
              </p>
            </div>
          </div>

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

      {/* MIGRATE MODAL - WITH COMPACT INLINE BRANCH SELECTION */}
      <Modal
        isOpen={showMigrateModal}
        onClose={() => {
          setShowMigrateModal(false);
          migrateForm.resetForm();
        }}
        title={`Migrate Stock from ${selectedHeadBranch?.branch_code || "Head Branch"}`}
        size="medium"
      >
        <form onSubmit={migrateForm.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Select Batch <span className="text-status-error">*</span>
            </label>
            <select
              name="certificate_id"
              value={migrateForm.values.certificate_id}
              onChange={migrateForm.handleChange}
              onBlur={migrateForm.handleBlur}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option
                value=""
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Choose a batch...
              </option>
              {availableBatchesForMigration.map((cert) => {
                const headStock = cert.stock_by_branch?.find(
                  (s) => s.branch_code === selectedHeadBranch?.branch_code,
                );
                return (
                  <option
                    key={cert.id}
                    value={cert.certificate_id}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {cert.certificate_id} - {selectedHeadBranch?.branch_code}:{" "}
                    {headStock?.certificates || 0} certs,{" "}
                    {headStock?.medals || 0} medals
                  </option>
                );
              })}
            </select>
            {migrateForm.touched.certificate_id &&
              migrateForm.errors.certificate_id && (
                <p className="text-sm text-status-error mt-1">
                  {migrateForm.errors.certificate_id}
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Destination Branch <span className="text-status-error">*</span>
            </label>
            {destinationBranches.length === 0 ? (
              <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 text-center">
                <p className="text-sm text-secondary">
                  No destination branches available in{" "}
                  {selectedHeadBranch?.branch_code} regional hub
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {destinationBranches.map((branch) => {
                  const isSelected =
                    migrateForm.values.destination_branch ===
                    branch.branch_code;
                  return (
                    <button
                      key={branch.branch_code}
                      type="button"
                      onClick={() =>
                        migrateForm.setFieldValue(
                          "destination_branch",
                          branch.branch_code,
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        isSelected
                          ? `${getBranchBorderColor(branch.branch_code)} ${getBranchBgColor(branch.branch_code)} ${getBranchTextColor(branch.branch_code)}`
                          : "border-gray-200 dark:border-white/10 text-secondary hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full bg-gradient-to-br flex-shrink-0 ${getBranchColor(branch.branch_code)}`}
                      />
                      <span>{branch.branch_code}</span>
                      <span
                        className={`text-xs ${isSelected ? "opacity-80" : "opacity-50"}`}
                      >
                        · {branch.branch_name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 ml-0.5 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {migrateForm.touched.destination_branch &&
              migrateForm.errors.destination_branch && (
                <p className="text-sm text-status-error mt-1">
                  {migrateForm.errors.destination_branch}
                </p>
              )}
          </div>

          <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 p-4 rounded-xl border border-gray-200/30 dark:border-white/5">
            <h4 className="text-sm font-semibold text-primary mb-3">
              Migration Amount
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-secondary mb-1">
                  Certificates
                </label>
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
                <label className="block text-sm text-secondary mb-1">
                  Medals
                </label>
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

          {migrateForm.values.certificate_id && selectedHeadBranch && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-primary font-medium mb-1">
                  Available {selectedHeadBranch.branch_code} Stock
                </p>
                <p className="text-sm text-secondary">
                  {(() => {
                    const cert = certificates.find(
                      (c) =>
                        c.certificate_id === migrateForm.values.certificate_id,
                    );
                    if (!cert) return "Batch not found";
                    const headStock = cert.stock_by_branch?.find(
                      (s) => s.branch_code === selectedHeadBranch.branch_code,
                    );
                    return `${headStock?.certificates || 0} certificates, ${headStock?.medals || 0} medals`;
                  })()}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                Migration Rules
              </p>
              <ul className="text-sm text-secondary space-y-1">
                <li>
                  • Stock is transferred from {selectedHeadBranch?.branch_code}{" "}
                  to the selected branch
                </li>
                <li>• At least one certificate or medal must be migrated</li>
                <li>
                  • Cannot exceed available {selectedHeadBranch?.branch_code}{" "}
                  stock
                </li>
                <li>• Can only migrate to branches in the same regional hub</li>
              </ul>
            </div>
          </div>

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
            <Button
              type="submit"
              variant="primary"
              size="medium"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              disabled={migrateForm.isSubmitting}
              loading={migrateForm.isSubmitting}
              className="flex-1"
            >
              Migrate Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Certificates;
