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
  modelConfigLoader,
  setOsAndDefaultDirectories as setDefaultDirectories,
  installedPrinterConfigLoader,
  vendorConfigLoader,
  installedFilamentConfigLoader,
  dataFilamentConfigLoader,
  installedProcessConfigLoader,
  dataProcessConfigLoader,
} from "./lib/commons";
import { globalState } from "./lib/state-store";
import { ToastContainer } from "react-toastify";
import BackgroundPlate from "./components/background-plate";

function App() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    vendorConfigs,
    modelConfigs,
    installedPrinterConfigs,
    installedFilamentConfigs,
    installedProcessConfigs,
    loadedSystemPrinterConfigs,
    loadedSystemFilamentConfigs,
    loadedSystemProcessConfigs,
    loadedUserPrinterConfigs,
    loadedUserFilamentConfigs,
    loadedUserProcessConfigs,
    instantiatedInstalledPrinterConfigs,
    instantiatedInstalledFilamentConfigs,
    instantiatedInstalledProcessConfigs,
    os,
    errLoadingDataPath,
    errLoadingInstallationPath,
  } = useHookstate(globalState);

  useEffect(() => {
    platform().then((a) => {
      os.set(a);
      setDefaultDirectories(a, orcaInstallationPath, orcaDataDirectory);
    });
  }, []);

  useEffect(() => {
    vendorConfigLoader(
      os,
      orcaInstallationPath,
      vendorConfigs,
      errLoadingInstallationPath
    );
  }, [orcaInstallationPath]);

  useEffect(() => {
    dataPrinterConfigLoader(
      orcaDataDirectory,
      loadedSystemPrinterConfigs,
      loadedUserPrinterConfigs,
      errLoadingDataPath
    );

    dataFilamentConfigLoader(
      orcaDataDirectory,
      loadedSystemFilamentConfigs,
      loadedUserFilamentConfigs,
      errLoadingDataPath
    );

    dataProcessConfigLoader(
      orcaDataDirectory,
      loadedSystemProcessConfigs,
      loadedUserProcessConfigs,
      errLoadingDataPath
    );
  }, [orcaDataDirectory]);

  useEffect(() => {
    modelConfigLoader(
      os,
      orcaInstallationPath,
      vendorConfigs,
      modelConfigs,
      errLoadingInstallationPath
    );

    installedPrinterConfigLoader(
      os,
      orcaInstallationPath,
      vendorConfigs,
      installedPrinterConfigs,
      instantiatedInstalledPrinterConfigs,
      errLoadingInstallationPath
    );

    installedFilamentConfigLoader(
      os,
      orcaInstallationPath,
      vendorConfigs,
      installedFilamentConfigs,
      instantiatedInstalledFilamentConfigs,
      errLoadingInstallationPath
    );

    installedProcessConfigLoader(
      os,
      orcaInstallationPath,
      vendorConfigs,
      installedProcessConfigs,
      instantiatedInstalledProcessConfigs,
      errLoadingInstallationPath
    );
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
