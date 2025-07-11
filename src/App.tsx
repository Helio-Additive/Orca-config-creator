import { useHookstate } from "@hookstate/core";
import { platform } from "@tauri-apps/api/os";
import { Tooltip } from "radix-ui";
import { useEffect } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import BackgroundPlate from "./components/background-plate";
import EditConfig from "./edit-config";
import Home from "./Home";
import {
  dataFilamentConfigLoader,
  dataPrinterConfigLoader,
  dataProcessConfigLoader,
  installedFilamentConfigLoader,
  installedModelConfigLoader,
  installedPrinterConfigLoader,
  installedProcessConfigLoader,
  installedVendorConfigLoader,
  loadedSystemModelConfigLoader,
  setOsAndDefaultDirectories as setDefaultDirectories,
} from "./lib/commons";
import { appState, globalState } from "./lib/state-store";

function App() {
  const configState = useHookstate(globalState);

  const {
    orcaInstallationPath,
    orcaDataDirectory,
    installedVendorConfigs: vendorConfigs,
    os,
  } = configState;

  const { selectedConfigs, selectedConfigType } = useHookstate(appState);

  useEffect(() => {
    platform().then((a) => {
      os.set(a);
      setDefaultDirectories(a, orcaInstallationPath, orcaDataDirectory);
    });
  }, []);

  useEffect(() => {
    installedVendorConfigLoader();

    selectedConfigs.set(new Set());
    selectedConfigType.set(undefined);
  }, [orcaInstallationPath]);

  useEffect(() => {
    loadedSystemModelConfigLoader();

    dataPrinterConfigLoader();

    dataFilamentConfigLoader();

    dataProcessConfigLoader();

    selectedConfigs.set(new Set());
    selectedConfigType.set(undefined);
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
