import "./App.css";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import BackgroundPlate from "./components/background-plate";
import TabbedWindow from "./components/tabbed-window";
import { platform } from "@tauri-apps/api/os";
import { ConfigNameAndPath } from "./lib/bindings/ConfigNameAndPath";
import { MinPrinterModelJsonSchema } from "./lib/bindings/MinPrinterModelJsonSchema";
import {
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY_MACOS,
  LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_BASE_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_MACHINE_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_SUBDIRECTORY_DIRECTORY,
} from "./lib/constants";
import { MinPrinterVariantJsonSchema } from "./lib/bindings/MinPrinterVariantJsonSchema";
import { fileProperty, globalState } from "./lib/state-store";
import { useHookstate } from "@hookstate/core";
import { VendorJsonSchema } from "./lib/bindings/VendorJsonSchema";

function App() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    vendorConfigs,
    modelConfigs,
    installedPrinterConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
    instantiatedInstalledPrinterConfigs,
    os,
    errLoadingDataPath,
    errLoadingInstallationPath,
  } = useHookstate(globalState);

  useEffect(() => {
    platform().then((a) => os.set(a));
  }, []);

  const get_installed_system_profiles_subdirectory_directory = () => {
    if (os.get() == "darwin")
      return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY_MACOS;
    else return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY;
  };

  useEffect(() => {
    const config_loader = async () => {
      try {
        if (orcaInstallationPath.get()) {
          console.log(
            orcaInstallationPath.get() +
              get_installed_system_profiles_subdirectory_directory()
          );
          const vendorConfigsRead: Record<string, VendorJsonSchema> =
            await invoke("load_all_system_vendor_profiles", {
              path:
                orcaInstallationPath.get() +
                get_installed_system_profiles_subdirectory_directory(),
            });

          vendorConfigs.set(vendorConfigsRead);
          errLoadingInstallationPath.set(undefined);
        } else {
          vendorConfigs.set({});
          errLoadingInstallationPath.set(undefined);
        }
      } catch (error: any) {
        vendorConfigs.set({});
        errLoadingInstallationPath.set(error);
      }
    };

    config_loader();
  }, [orcaInstallationPath]);

  useEffect(() => {
    const config_loader = async () => {
      try {
        if (orcaDataDirectory.get()) {
          const vendorConfigsRead: Record<string, VendorJsonSchema> =
            await invoke("load_all_system_vendor_profiles", {
              path:
                orcaDataDirectory.get() +
                LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
            });

          Object.keys(vendorConfigsRead).map(async (key) => {
            const vendorConfig = vendorConfigsRead[key];
            const machine_list =
              vendorConfig.machine_list as ConfigNameAndPath[];

            const printerConfigsParsed: (MinPrinterModelJsonSchema & {
              fileName: string;
            })[] = await invoke("load_all_printer_presets", {
              path:
                orcaDataDirectory.get() +
                LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY +
                "/" +
                key,
              configNameAndPaths: machine_list,
            });

            for (let i = 0; i < machine_list.length; i++) {
              printerConfigsParsed[i].fileName =
                orcaDataDirectory.get() +
                LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY +
                "/" +
                key +
                "/" +
                machine_list[i].sub_path;

              loadedSystemPrinterConfigs[key].merge({
                [machine_list[i].name]: printerConfigsParsed[i],
              });
            }
          });

          const userMachineDirectory =
            orcaDataDirectory.get({ stealth: true }) +
            LOADED_USER_PROFILES_SUBDIRECTORY_DIRECTORY +
            LOADED_USER_PROFILES_MACHINE_SUBDIRECTORY_DIRECTORY;
          const userMachineBaseDirectory =
            userMachineDirectory +
            LOADED_USER_PROFILES_BASE_SUBDIRECTORY_DIRECTORY;

          const inheritedPrinterConfigs: [
            String,
            MinPrinterVariantJsonSchema
          ][] = await invoke("load_all_user_printer_profiles_in_dir", {
            path: userMachineDirectory,
          });

          try {
            const basePrinterConfigs: [String, MinPrinterVariantJsonSchema][] =
              await invoke("load_all_user_printer_profiles_in_dir", {
                path: userMachineBaseDirectory,
              });

            basePrinterConfigs.forEach(([path, config]) => {
              const configWithFileName: MinPrinterVariantJsonSchema &
                fileProperty = { ...config, fileName: path.toString() };
              loadedUserPrinterConfigs.merge({
                [config.name]: configWithFileName,
              });
            });
          } catch (error: any) {
            console.log("base directory does not exist, skipping");
          }

          inheritedPrinterConfigs.forEach(([path, config]) => {
            const configWithFileName: MinPrinterVariantJsonSchema &
              fileProperty = { ...config, fileName: path.toString() };
            loadedUserPrinterConfigs.merge({
              [config.name]: configWithFileName,
            });
          });

          errLoadingDataPath.set(undefined);
        } else {
          loadedSystemPrinterConfigs.set({});
          errLoadingDataPath.set(undefined);
        }
      } catch (error: any) {
        errLoadingDataPath.set(error);
      }
    };

    config_loader();
  }, [orcaDataDirectory]);

  useEffect(() => {
    const config_loader = async () => {
      try {
        if (orcaInstallationPath.get()) {
          vendorConfigs.keys.map(async (key) => {
            const vendorConfig = vendorConfigs[key].get({ stealth: true });
            const machine_model_list =
              vendorConfig.machine_model_list as ConfigNameAndPath[];
            const modelConfigsParsed: (MinPrinterModelJsonSchema & {
              fileName: string;
            })[] = await invoke("load_all_printer_model_presets", {
              path:
                orcaInstallationPath.get() +
                get_installed_system_profiles_subdirectory_directory() +
                "/" +
                key,
              configNameAndPaths: machine_model_list,
            });

            for (let i = 0; i < machine_model_list.length; i++) {
              modelConfigsParsed[i].fileName =
                orcaInstallationPath.get() +
                get_installed_system_profiles_subdirectory_directory() +
                "/" +
                key +
                "/" +
                machine_model_list[i].sub_path;
              modelConfigs[machine_model_list[i].name].set(
                modelConfigsParsed[i]
              );
            }
          });
        } else {
          console.log("error");
          modelConfigs.set({});
        }
      } catch (error: any) {
        console.log(error);
        modelConfigs.set({});
      }
    };

    config_loader();
  }, [vendorConfigs]);

  useEffect(() => {
    const config_loader = async () => {
      try {
        if (orcaInstallationPath.get()) {
          vendorConfigs.keys.map(async (key) => {
            const vendorConfig = vendorConfigs[key].get({ stealth: true });
            const machine_list =
              vendorConfig.machine_list as ConfigNameAndPath[];
            const printerConfigsParsed: ({
              Ok?: MinPrinterVariantJsonSchema;
              Err?: string;
            } & {
              fileName: string;
            })[] = await invoke("load_all_printer_presets", {
              path:
                orcaInstallationPath.get() +
                get_installed_system_profiles_subdirectory_directory() +
                "/" +
                key,
              configNameAndPaths: machine_list,
            });

            for (let i = 0; i < machine_list.length; i++) {
              printerConfigsParsed[i].fileName =
                orcaInstallationPath.get() +
                get_installed_system_profiles_subdirectory_directory() +
                "/" +
                key +
                "/" +
                machine_list[i].sub_path;

              installedPrinterConfigs[key].merge({
                [machine_list[i].name]: printerConfigsParsed[i],
              });

              if (printerConfigsParsed[i].Ok?.instantiation)
                instantiatedInstalledPrinterConfigs.merge({
                  [machine_list[i].name]: {
                    ...printerConfigsParsed[i].Ok!,
                    fileName: printerConfigsParsed[i].fileName,
                  },
                });
            }
          });
        } else {
          installedPrinterConfigs.set({});
        }
      } catch (error: any) {
        console.log(error);
        installedPrinterConfigs.set({});
      }
    };

    config_loader();
  }, [vendorConfigs]);

  return (
    <main className="h-screen max-h-screen">
      <BackgroundPlate />
      <TabbedWindow />
    </main>
  );
}

export default App;
