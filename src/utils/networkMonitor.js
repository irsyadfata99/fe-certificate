import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Hook to monitor network status
 */
export const useNetworkStatus = () => {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online!", {
        icon: "🌐",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      toast.error("No internet connection", {
        icon: "📡",
        duration: 10000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
};

/**
 * Check if user is online
 */
export const isOnline = () => {
  return navigator.onLine;
};
