/**
 * Quick Test Script
 * Jalankan manual checks untuk verify konfigurasi
 *
 * Usage:
 * Import di component manapun dan panggil runQuickTest()
 *
 * Example:
 * import { runQuickTest } from '@utils/quickTest';
 *
 * // Di dalam component
 * useEffect(() => {
 *   runQuickTest();
 * }, []);
 */

import {
  checkEnvironment,
  checkPathAliases,
  checkAPIConnection,
  checkAxiosInterceptors,
  checkStorage,
} from "@utils/devTools";

/**
 * Run quick configuration test
 * Panggil function ini untuk manual check
 */
export const runQuickTest = async () => {
  console.clear();
  console.log("=".repeat(60));
  console.log("🧪 QUICK CONFIGURATION TEST");
  console.log("=".repeat(60));
  console.log("");

  // 1. Environment
  console.log("1️⃣ Testing Environment Configuration...");
  const envResult = checkEnvironment();
  console.log("");

  // 2. Path Aliases
  console.log("2️⃣ Testing Path Aliases...");
  const pathResult = checkPathAliases();
  console.log("");

  // 3. Storage
  console.log("3️⃣ Testing Browser Storage...");
  const storageResult = checkStorage();
  console.log("");

  // 4. Axios
  console.log("4️⃣ Testing Axios Configuration...");
  const axiosResult = checkAxiosInterceptors();
  console.log("");

  // 5. API Connection
  console.log("5️⃣ Testing API Connection...");
  const apiResult = await checkAPIConnection();
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const results = {
    environment: envResult.isValid,
    pathAliases: pathResult.isValid,
    storage: storageResult.localStorage && storageResult.sessionStorage,
    axios: axiosResult.request && axiosResult.response,
    api: apiResult.isConnected,
  };

  console.table(results);

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log("");
    console.log("✅ ALL TESTS PASSED! Configuration is ready.");
    console.log("");
  } else {
    console.log("");
    console.warn("⚠️ SOME TESTS FAILED. Please check the logs above.");
    console.log("");
  }

  console.log("=".repeat(60));

  return results;
};

/**
 * Test specific feature
 */
export const testFeature = {
  environment: checkEnvironment,
  pathAliases: checkPathAliases,
  apiConnection: checkAPIConnection,
  axios: checkAxiosInterceptors,
  storage: checkStorage,
};

export default runQuickTest;
