import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useNetworkStatus } from "./utils/networkMonitor";
import { useThemeStore } from "./store/themeStore";

function App() {
  // Monitor network status
  useNetworkStatus();

  // Initialize theme
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <AppRoutes />;
}

export default App;
