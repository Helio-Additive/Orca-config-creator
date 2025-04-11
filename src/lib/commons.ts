import { invoke } from "@tauri-apps/api/tauri";
import {
  directoryDefaults,
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY_MACOS,
  LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_BASE_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_MACHINE_SUBDIRECTORY_DIRECTORY,
  LOADED_USER_PROFILES_SUBDIRECTORY_DIRECTORY,
} from "./constants";
import { State } from "@hookstate/core";
import { toast } from "react-toastify";
import { homeDir } from "@tauri-apps/api/path";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";
import { ConfigNameAndPath } from "./bindings/ConfigNameAndPath";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { fileProperty } from "./state-store";

export const checkDirectoryExists = async (path: string) => {
  return await invoke("check_directory", { path: path });
};

export const checkFileExists = async (path: string) => {
  return await invoke("check_file", { path: path });
};

export const setOsAndDefaultDirectories = async (
  os: string,
  orcaInstallationPath: State<string | undefined, {}>,
  orcaDataDirectory: State<string | undefined, {}>
) => {
  switch (os) {
    case "darwin": {
      checkDirectoryExists(directoryDefaults.darwin.installationDirectory).then(
        (res) => {
          if (res) {
            orcaInstallationPath.set(
              directoryDefaults.darwin.installationDirectory
            );
            toast("Set default installation directory", {
              type: "success",
            });
          } else
            toast(
              "Default installation directory does not exist.\nPlease set manually",
              { type: "error" }
            );
        }
      );

      homeDir().then((homeDirectory) => {
        const dataDirectory =
          homeDirectory + directoryDefaults.darwin.dataSubdirectory;
        checkDirectoryExists(dataDirectory).then((res) => {
          if (res) {
            orcaDataDirectory.set(dataDirectory);
            toast("Set default data directory", {
              type: "success",
            });
          } else
            toast(
              "Default data directory does not exist.\nPlease set manually",
              { type: "error" }
            );
        });
      });

      break;
    }

    case "win32": {
      checkDirectoryExists(directoryDefaults.win32.installationDirectory).then(
        (res) => {
          if (res) {
            orcaInstallationPath.set(
              directoryDefaults.win32.installationDirectory
            );
            toast("Set default installation directory", {
              type: "success",
            });
          } else
            toast(
              "Default installation directory does not exist.\nPlease set manually",
              { type: "error" }
            );
        }
      );

      homeDir().then((homeDirectory) => {
        const dataDirectory =
          homeDirectory + directoryDefaults.win32.dataSubdirectory;
        checkDirectoryExists(dataDirectory).then((res) => {
          if (res) {
            orcaDataDirectory.set(dataDirectory);
            toast("Set default data directory", {
              type: "success",
            });
          } else
            toast(
              "Default data directory does not exist.\nPlease set manually",
              { type: "error" }
            );
        });
      });

      break;
    }
  }
};

export const vendorConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema>>,
  errLoadingInstallationPath: State<string | undefined>
) => {
  try {
    if (orcaInstallationPath.get({ stealth: true })) {
      const vendorConfigsRead: Record<string, VendorJsonSchema> = await invoke(
        "load_all_system_vendor_profiles",
        {
          path:
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()),
        }
      );

      vendorConfigs.set(vendorConfigsRead);
      errLoadingInstallationPath.set(undefined);
      toast("Loaded system vendor configurations", { type: "success" });
    } else {
      vendorConfigs.set({});
      errLoadingInstallationPath.set(undefined);
    }
  } catch (error: any) {
    vendorConfigs.set({});
    toast(error, { type: "error" });
    errLoadingInstallationPath.set(error);
  }
};

export const modelConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined, {}>,
  vendorConfigs: State<Record<string, VendorJsonSchema>>,
  modelConfigs: State<
    Record<
      string,
      { Ok?: MinPrinterModelJsonSchema; Err?: string } & fileProperty
    >
  >,
  errLoadingInstallationPath: State<string | undefined>
) => {
  try {
    if (
      orcaInstallationPath.get({ stealth: true }) &&
      !errLoadingInstallationPath.get({ stealth: true })
    ) {
      vendorConfigs.keys.map(async (key) => {
        const vendorConfig = vendorConfigs[key].get({ stealth: true });
        const machine_model_list =
          vendorConfig.machine_model_list as ConfigNameAndPath[];
        const modelConfigsParsed: (MinPrinterModelJsonSchema & {
          fileName: string;
        })[] = await invoke("load_all_printer_model_presets", {
          path:
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
            "/" +
            key,
          configNameAndPaths: machine_model_list,
        });

        for (let i = 0; i < machine_model_list.length; i++) {
          modelConfigsParsed[i].fileName =
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
            "/" +
            key +
            "/" +
            machine_model_list[i].sub_path;
          modelConfigs[machine_model_list[i].name].set(modelConfigsParsed[i]);
        }
      });

      toast("Loaded system model configs", { type: "success" });
    } else {
      modelConfigs.set({});
    }
  } catch (error: any) {
    toast(error, { type: "error" });
    console.log(error);
    modelConfigs.set({});
  }
};

export const dataPrinterConfigLoader = async (
  orcaDataDirectory: State<string | undefined>,
  loadedSystemPrinterConfigs: State<
    Record<
      string,
      Record<
        string,
        { Ok?: MinPrinterVariantJsonSchema; Err?: string } & fileProperty
      >
    >
  >,
  loadedUserPrinterConfigs: State<
    Record<string, MinPrinterVariantJsonSchema & fileProperty>
  >,
  errLoadingDataPath: State<string | undefined>
) => {
  try {
    if (
      orcaDataDirectory.get({ stealth: true }) &&
      !errLoadingDataPath.get({ stealth: true })
    ) {
      const vendorConfigsRead: Record<string, VendorJsonSchema> = await invoke(
        "load_all_system_vendor_profiles",
        {
          path:
            orcaDataDirectory.get({ stealth: true }) +
            LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY,
        }
      );

      Object.keys(vendorConfigsRead).map(async (key) => {
        const vendorConfig = vendorConfigsRead[key];
        const machine_list = vendorConfig.machine_list as ConfigNameAndPath[];

        const printerConfigsParsed: (MinPrinterModelJsonSchema & {
          fileName: string;
        })[] = await invoke("load_all_printer_presets", {
          path:
            orcaDataDirectory.get({ stealth: true }) +
            LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY +
            "/" +
            key,
          configNameAndPaths: machine_list,
        });

        for (let i = 0; i < machine_list.length; i++) {
          printerConfigsParsed[i].fileName =
            orcaDataDirectory.get({ stealth: true }) +
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
        userMachineDirectory + LOADED_USER_PROFILES_BASE_SUBDIRECTORY_DIRECTORY;

      const inheritedPrinterConfigs: [String, MinPrinterVariantJsonSchema][] =
        await invoke("load_all_user_printer_profiles_in_dir", {
          path: userMachineDirectory,
        });

      try {
        const basePrinterConfigs: [String, MinPrinterVariantJsonSchema][] =
          await invoke("load_all_user_printer_profiles_in_dir", {
            path: userMachineBaseDirectory,
          });

        basePrinterConfigs.forEach(([path, config]) => {
          const configWithFileName: MinPrinterVariantJsonSchema & fileProperty =
            { ...config, fileName: path.toString() };
          loadedUserPrinterConfigs.merge({
            [config.name]: configWithFileName,
          });
        });
      } catch (error: any) {
        console.log("base directory does not exist, skipping");
      }

      inheritedPrinterConfigs.forEach(([path, config]) => {
        const configWithFileName: MinPrinterVariantJsonSchema & fileProperty = {
          ...config,
          fileName: path.toString(),
        };
        loadedUserPrinterConfigs.merge({
          [config.name]: configWithFileName,
        });
      });

      errLoadingDataPath.set(undefined);
      toast("Loaded user printer profiles", { type: "success" });
    } else {
      loadedSystemPrinterConfigs.set({});
      errLoadingDataPath.set(undefined);
    }
  } catch (error: any) {
    loadedSystemPrinterConfigs.set({});
    errLoadingDataPath.set(error);
    toast(error, { type: "error" });
  }
};

export const systemPrinterConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema>>,
  installedPrinterConfigs: State<
    Record<
      string,
      Record<
        string,
        { Ok?: MinPrinterVariantJsonSchema; Err?: string } & fileProperty
      >
    >
  >,
  instantiatedInstalledPrinterConfigs: State<
    Record<string, MinPrinterVariantJsonSchema & fileProperty>
  >,
  errLoadingInstallationPath: State<string | undefined>
) => {
  try {
    if (
      orcaInstallationPath.get({ stealth: true }) &&
      !errLoadingInstallationPath.get({ stealth: true })
    ) {
      vendorConfigs.keys.map(async (key) => {
        const vendorConfig = vendorConfigs[key].get({ stealth: true });
        const machine_list = vendorConfig.machine_list as ConfigNameAndPath[];
        const printerConfigsParsed: ({
          Ok?: MinPrinterVariantJsonSchema;
          Err?: string;
        } & {
          fileName: string;
        })[] = await invoke("load_all_printer_presets", {
          path:
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
            "/" +
            key,
          configNameAndPaths: machine_list,
        });

        for (let i = 0; i < machine_list.length; i++) {
          printerConfigsParsed[i].fileName =
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
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

      toast("Loaded system machine configs", { type: "success" });
    } else {
      installedPrinterConfigs.set({});
    }
  } catch (error: any) {
    toast(error, { type: "error" });
    console.log(error);
    installedPrinterConfigs.set({});
  }
};

export const get_installed_system_profiles_subdirectory_directory = (
  os: string
) => {
  if (os == "darwin")
    return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY_MACOS;
  else return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY;
};
