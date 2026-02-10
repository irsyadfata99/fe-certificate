import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-hot-toast";
import {
  FiPrinter,
  FiSearch,
  FiCalendar,
  FiPackage,
  FiUser,
  FiBook,
} from "react-icons/fi";
import { useAuth } from "@context/AuthContext";
import {
  getModulesForPrint,
  savePrintRecord,
  searchStudentsForPrint,
} from "@services/printedCertificateApi";
import { getCertificates } from "@services/certificateApi";
import CertificatePreview from "@components/certificates/CertificatePreview";
import StudentAutocomplete from "@components/certificates/StudentAutocomplete";
import { validateRequired, validateDate } from "@utils/validators";

const PrintCertificate = () => {
  const { user } = useAuth();
  const printRef = useRef();

  // Form state
  const [formData, setFormData] = useState({
    certificateId: "",
    studentName: "",
    studentId: null,
    moduleId: "",
    ptcDate: new Date().toISOString().split("T")[0],
  });

  // Data states
  const [modules, setModules] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // =====================================================
  // FETCH MODULES ON MOUNT
  // =====================================================
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const response = await getModulesForPrint();

      if (response.success) {
        setModules(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoadingModules(false);
    }
  };

  // =====================================================
  // FETCH AVAILABLE BATCHES WHEN CERTIFICATE ID CHANGES
  // =====================================================
  useEffect(() => {
    if (formData.certificateId.trim().length >= 3) {
      fetchAvailableBatches();
    } else {
      setAvailableBatches([]);
      setSelectedBatch(null);
    }
  }, [formData.certificateId]);

  const fetchAvailableBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await getCertificates({
        search: formData.certificateId,
        limit: 50,
      });

      if (response.success && response.data) {
        // Filter batches:
        // 1. Exact or partial match with certificate_id
        // 2. User's branch has stock > 0 for both certificate AND medal
        const filtered = response.data.filter((batch) => {
          const matchesId = batch.certificate_id
            .toLowerCase()
            .includes(formData.certificateId.toLowerCase());

          const userStock = batch.stock_distribution?.find(
            (s) => s.branch_code === user.teacher_branch,
          );

          const hasStock =
            userStock &&
            userStock.jumlah_sertifikat > 0 &&
            userStock.jumlah_medali > 0;

          return matchesId && hasStock;
        });

        setAvailableBatches(filtered);

        // Auto-select if exact match found
        const exactMatch = filtered.find(
          (b) =>
            b.certificate_id.toLowerCase() ===
            formData.certificateId.toLowerCase(),
        );

        if (exactMatch) {
          setSelectedBatch(exactMatch);
        } else if (filtered.length === 1) {
          setSelectedBatch(filtered[0]);
        } else {
          setSelectedBatch(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  // =====================================================
  // UPDATE SELECTED MODULE WHEN moduleId CHANGES
  // =====================================================
  useEffect(() => {
    if (formData.moduleId) {
      const module = modules.find((m) => m.id === parseInt(formData.moduleId));
      setSelectedModule(module || null);
    } else {
      setSelectedModule(null);
    }
  }, [formData.moduleId, modules]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleStudentSelect = (student) => {
    setFormData((prev) => ({
      ...prev,
      studentName: student.student_name,
      studentId: student.id,
    }));

    if (errors.studentName) {
      setErrors((prev) => ({
        ...prev,
        studentName: "",
      }));
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================
  const validateForm = () => {
    const newErrors = {};

    // Certificate ID
    const certIdValidation = validateRequired(
      formData.certificateId,
      "Certificate ID",
    );
    if (!certIdValidation.valid) {
      newErrors.certificateId = certIdValidation.message;
    } else if (!selectedBatch) {
      newErrors.certificateId =
        "No available batch found with stock for this ID";
    }

    // Student Name
    const studentNameValidation = validateRequired(
      formData.studentName,
      "Student name",
    );
    if (!studentNameValidation.valid) {
      newErrors.studentName = studentNameValidation.message;
    } else if (formData.studentName.trim().length < 3) {
      newErrors.studentName = "Student name must be at least 3 characters";
    }

    // Module
    const moduleValidation = validateRequired(formData.moduleId, "Module");
    if (!moduleValidation.valid) {
      newErrors.moduleId = moduleValidation.message;
    }

    // PTC Date
    const dateValidation = validateDate(formData.ptcDate, "PTC Date");
    if (!dateValidation.valid) {
      newErrors.ptcDate = dateValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // PREVIEW HANDLER
  // =====================================================
  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
      toast.success("Preview ready! Review before printing.", {
        icon: "👀",
      });
    } else {
      toast.error("Please fix the errors before previewing");
    }
  };

  // =====================================================
  // PRINT HANDLER
  // =====================================================
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Certificate_${formData.studentName.replace(/\s+/g, "_")}_${formData.certificateId}`,
    onBeforeGetContent: async () => {
      if (!validateForm()) {
        toast.error("Please fix the errors before printing");
        throw new Error("Validation failed");
      }
    },
    onAfterPrint: async () => {
      // Save record and deduct stock after successful print
      await handleSavePrintRecord();
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Print cancelled or failed");
    },
  });

  // =====================================================
  // SAVE PRINT RECORD (AFTER PRINT)
  // =====================================================
  const handleSavePrintRecord = async () => {
    try {
      setLoading(true);

      const payload = {
        certificate_id: selectedBatch.certificate_id,
        student_name: formData.studentName.trim(),
        student_id: formData.studentId,
        module_id: parseInt(formData.moduleId),
        ptc_date: formData.ptcDate,
      };

      const response = await savePrintRecord(payload);

      if (response.success) {
        toast.success("Certificate printed and stock updated successfully!", {
          duration: 4000,
        });

        // Reset form
        setFormData({
          certificateId: "",
          studentName: "",
          studentId: null,
          moduleId: "",
          ptcDate: new Date().toISOString().split("T")[0],
        });
        setSelectedBatch(null);
        setSelectedModule(null);
        setShowPreview(false);
        setErrors({});

        // Refresh batches
        fetchAvailableBatches();
      }
    } catch (error) {
      console.error("Failed to save print record:", error);
      toast.error(
        error.response?.data?.message || "Failed to save print record",
        { duration: 5000 },
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Print Certificate
        </h1>
        <p className="text-gray-600">
          Fill in student details and print official certificate with automatic
          stock deduction
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            Certificate Details
          </h2>

          <form className="space-y-5">
            {/* Certificate ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiSearch className="inline mr-1" />
                Certificate Batch ID *
              </label>
              <input
                type="text"
                name="certificateId"
                value={formData.certificateId}
                onChange={handleInputChange}
                placeholder="e.g., CERT-2024-001"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.certificateId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {errors.certificateId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.certificateId}
                </p>
              )}

              {/* Batch Status */}
              {loadingBatches && (
                <p className="text-sm text-gray-500 mt-1">
                  Searching batches...
                </p>
              )}

              {!loadingBatches && formData.certificateId.length >= 3 && (
                <div className="mt-2">
                  {selectedBatch ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Batch Found: {selectedBatch.certificate_id}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Stock at {user.teacher_branch}:{" "}
                        {
                          selectedBatch.stock_distribution?.find(
                            (s) => s.branch_code === user.teacher_branch,
                          )?.jumlah_sertifikat
                        }{" "}
                        certificates,{" "}
                        {
                          selectedBatch.stock_distribution?.find(
                            (s) => s.branch_code === user.teacher_branch,
                          )?.jumlah_medali
                        }{" "}
                        medals
                      </p>
                    </div>
                  ) : availableBatches.length > 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Multiple batches found ({availableBatches.length})
                      </p>
                      <select
                        onChange={(e) => {
                          const batch = availableBatches.find(
                            (b) => b.certificate_id === e.target.value,
                          );
                          setSelectedBatch(batch);
                          setFormData((prev) => ({
                            ...prev,
                            certificateId: e.target.value,
                          }));
                        }}
                        className="w-full mt-2 px-3 py-1 border border-yellow-300 rounded text-sm"
                      >
                        <option value="">Select a batch...</option>
                        {availableBatches.map((batch) => (
                          <option
                            key={batch.certificate_id}
                            value={batch.certificate_id}
                          >
                            {batch.certificate_id} (
                            {
                              batch.stock_distribution?.find(
                                (s) => s.branch_code === user.teacher_branch,
                              )?.jumlah_sertifikat
                            }{" "}
                            certs,{" "}
                            {
                              batch.stock_distribution?.find(
                                (s) => s.branch_code === user.teacher_branch,
                              )?.jumlah_medali
                            }{" "}
                            medals)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800">
                        ✗ No batch found with available stock
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Check if batch exists and has stock at{" "}
                        {user.teacher_branch}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Student Name with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUser className="inline mr-1" />
                Student Name *
              </label>
              <StudentAutocomplete
                value={formData.studentName}
                onChange={handleInputChange}
                onSelect={handleStudentSelect}
                branchCode={user.teacher_branch}
                error={errors.studentName}
                disabled={loading}
              />
              {errors.studentName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.studentName}
                </p>
              )}
              {formData.studentId && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Linked to student ID: {formData.studentId}
                </p>
              )}
            </div>

            {/* Module Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiBook className="inline mr-1" />
                Module *
              </label>
              <select
                name="moduleId"
                value={formData.moduleId}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.moduleId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || loadingModules}
              >
                <option value="">
                  {loadingModules ? "Loading modules..." : "Select module..."}
                </option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name} ({module.division}) - Age {module.min_age}-
                    {module.max_age}
                  </option>
                ))}
              </select>
              {errors.moduleId && (
                <p className="text-red-500 text-sm mt-1">{errors.moduleId}</p>
              )}
            </div>

            {/* PTC Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" />
                PTC Date *
              </label>
              <input
                type="date"
                name="ptcDate"
                value={formData.ptcDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ptcDate ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {errors.ptcDate && (
                <p className="text-red-500 text-sm mt-1">{errors.ptcDate}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Certificate
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || !showPreview}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiPrinter />
                Print & Save
              </button>
            </div>

            {!showPreview && (
              <p className="text-sm text-gray-500 text-center">
                Preview certificate before printing
              </p>
            )}
          </form>
        </div>

        {/* RIGHT: Preview Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Print Preview (A4 Landscape)
          </h2>

          {showPreview && selectedModule ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <CertificatePreview
                ref={printRef}
                studentName={formData.studentName}
                moduleName={selectedModule.name}
                moduleCode={selectedModule.name}
                division={selectedModule.division}
                ptcDate={formData.ptcDate}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <FiPackage className="mx-auto text-5xl mb-3" />
                <p className="text-lg font-medium">No Preview Yet</p>
                <p className="text-sm mt-1">
                  Fill in the form and click Preview to see certificate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Printing will automatically deduct 1 certificate AND 1 medal from
            stock
          </li>
          <li>
            Make sure to review the preview before printing to avoid wasted
            stock
          </li>
          <li>
            Student names are auto-linked if they exist in the system (by
            branch)
          </li>
          <li>All print records are logged for tracking and auditing</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintCertificate;
