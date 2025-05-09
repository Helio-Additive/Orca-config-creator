import { useHookstate } from "@hookstate/core";
import { Tooltip } from "radix-ui";
import { platform } from "@tauri-apps/api/os";
import { useEffect } from "react";
import "./App.css";
import EditConfig from "./edit-config";
import Home from "./Home";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import {
  dataPrinterConfigLoader,
  installedModelConfigLoader as installedModelConfigLoader,
  setOsAndDefaultDirectories as setDefaultDirectories,
  installedPrinterConfigLoader,
  installedVendorConfigLoader,
  installedFilamentConfigLoader,
  dataFilamentConfigLoader,
  installedProcessConfigLoader,
  dataProcessConfigLoader,
  loadedSystemModelConfigLoader,
} from "./lib/commons";
import { globalState } from "./lib/state-store";
import { ToastContainer } from "react-toastify";
import BackgroundPlate from "./components/background-plate";

function App() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    installedVendorConfigs: vendorConfigs,
    os,
    errLoadingInstallationPath,
  } = useHookstate(globalState);

  useEffect(() => {
    platform().then((a) => {
      os.set(a);
      setDefaultDirectories(a, orcaInstallationPath, orcaDataDirectory);
    });
  }, []);

  useEffect(() => {
    installedVendorConfigLoader();
  }, [orcaInstallationPath]);

  useEffect(() => {
    loadedSystemModelConfigLoader();

    dataPrinterConfigLoader();

    dataFilamentConfigLoader();

    dataProcessConfigLoader();
  }, [orcaDataDirectory]);

  useEffect(() => {
    installedModelConfigLoader();

    installedPrinterConfigLoader();

    installedFilamentConfigLoader();

    installedProcessConfigLoader();
  }, [vendorConfigs]);

  return (
    <main>
      <Tooltip.Provider delayDuration={800}>
        <ToastContainer theme="colored" />
        <BackgroundPlate />

        <div className="flex h-screen w-full max-h-screen max-w-screen justify-start py-10 px-10">
          <div className="w-full h-full">
            <Router>
              <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/edit" element={<EditConfig />} />
              </Routes>
            </Router>
          </div>
        </div>
      </Tooltip.Provider>
    </main>
  );
}

export default App;
