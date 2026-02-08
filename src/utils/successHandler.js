import toast from "react-hot-toast";
import { ENV } from "../config/env";

/**
 * Standardized success handler
 */
export const handleSuccess = (message, options = {}) => {
  const {
    duration = 3000,
    icon = "✅",
    position = "top-right",
    logSuccess = ENV.IS_DEV,
  } = options;

  // Show toast notification
  toast.success(message, {
    duration,
    icon,
    position,
  });

  // Log in development
  if (logSuccess) {
    console.log("✅ Success:", message);
  }
};

/**
 * Handle operation success with data
 */
export const handleOperationSuccess = (
  operation,
  data = null,
  options = {},
) => {
  const messages = {
    create: "Created successfully",
    update: "Updated successfully",
    delete: "Deleted successfully",
    save: "Saved successfully",
    send: "Sent successfully",
    upload: "Uploaded successfully",
    download: "Downloaded successfully",
    export: "Exported successfully",
    import: "Imported successfully",
    migrate: "Migrated successfully",
    print: "Printed successfully",
  };

  const message = messages[operation] || "Operation completed successfully";

  handleSuccess(message, options);

  // Log data in development
  if (ENV.IS_DEV && data) {
    console.log(`Success data for ${operation}:`, data);
  }

  return { success: true, data };
};
