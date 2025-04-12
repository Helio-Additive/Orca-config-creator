import { useHookstate } from "@hookstate/core";
import { platform } from "@tauri-apps/api/os";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "./App.css";
import BackgroundPlate from "./components/background-plate";
import TabbedWindow from "./components/tabbed-window";
import {
  dataPrinterConfigLoader,
  modelConfigLoader,
  setOsAndDefaultDirectories as setDefaultDirectories,
  installedPrinterConfigLoader,
  vendorConfigLoader,
  installedFilamentConfigLoader,
  dataFilamentConfigLoader,
} from "./lib/commons";
import { globalState } from "./lib/state-store";

function App() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    vendorConfigs,
    modelConfigs,
    installedPrinterConfigs,
    installedFilamentConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
    loadedSystemFilamentConfigs,
    loadedUserFilamentConfigs,
    instantiatedInstalledPrinterConfigs,
    instantiatedInstalledFilamentConfigs,
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
  }, [vendorConfigs]);

  return (
    <main className="h-screen max-h-screen">
      <ToastContainer theme="colored" />
      <BackgroundPlate />
      <TabbedWindow />
    </main>
  );
}

export default App;
