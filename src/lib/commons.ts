import { State } from "@hookstate/core";
import { homeDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import { ConfigNameAndPath } from "./bindings/ConfigNameAndPath";
import { MinFilamentJsonSchema } from "./bindings/MinFilamentJsonSchema";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";
import {
  directoryDefaults,
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY,
  INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_MACOS,
  LOADED_SYSTEM_PROFILES_SUBDIRECTORY,
  LOADED_USER_PROFILES_BASE_SUBDIRECTORY,
  LOADED_USER_PROFILES_SUBDIRECTORY,
} from "./constants";
import {
  familyProperty,
  fileProperty,
  globalState,
  KeyDetails,
  Warning,
} from "./state-store";
import { PrinterVariantJsonSchema } from "./bindings/PrinterVariantJsonSchema";
import { FilamentJsonSchema } from "./bindings/FilamentJsonSchema";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import { MinProcessJsonSchema } from "./bindings/MinProcessJsonSchema";
import { ProcessJsonSchema } from "./bindings/ProcessJsonSchema";
import { NavigateFunction } from "react-router-dom";

export type ConfigLocationType = "installed" | "loaded_system" | "user";

export type ConfigType =
  | "printer"
  | "printer-model"
  | "filament"
  | "process"
  | "vendor";

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
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
  errLoadingInstallationPath: State<string | undefined>
) => {
  try {
    if (orcaInstallationPath.get({ stealth: true })) {
      const vendorConfigsPath =
        orcaInstallationPath.get({ stealth: true }) +
        get_installed_system_profiles_subdirectory_directory(os.get());

      const vendorConfigsRead: Record<string, VendorJsonSchema & fileProperty> =
        await invoke("load_all_system_vendor_profiles", {
          path: vendorConfigsPath,
        });

      Object.entries(vendorConfigsRead).forEach(([key, value]) => {
        value.fileName = vendorConfigsPath + "/" + key + ".json";
      });

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
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
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

export async function dataConfigLoader<
  T extends
    | MinPrinterVariantJsonSchema
    | MinFilamentJsonSchema
    | MinProcessJsonSchema
>(
  orcaDataDirectory: State<string | undefined>,
  loadedSystemConfigs: State<
    Record<string, Record<string, { Ok?: T; Err?: string } & fileProperty>>
  >,
  loadedUserConfigs: State<Record<string, T & fileProperty>>,
  errLoadingDataPath: State<string | undefined>,
  messageKey: string,
  propKey: string,
  systemConfigLoaderFunction: string,
  userConfigLoaderFunction: string,
  loadedUserProfilesConfigSubdirectory: string
) {
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
            LOADED_SYSTEM_PROFILES_SUBDIRECTORY,
        }
      );

      Object.keys(vendorConfigsRead).map(async (key) => {
        const vendorConfig = vendorConfigsRead[key];
        const configList = vendorConfig[propKey] as ConfigNameAndPath[];

        const printerConfigsParsed: (T & fileProperty)[] = await invoke(
          systemConfigLoaderFunction,
          {
            path:
              orcaDataDirectory.get({ stealth: true }) +
              LOADED_SYSTEM_PROFILES_SUBDIRECTORY +
              "/" +
              key,
            configNameAndPaths: configList,
          }
        );

        for (let i = 0; i < configList.length; i++) {
          printerConfigsParsed[i].fileName =
            orcaDataDirectory.get({ stealth: true }) +
            LOADED_SYSTEM_PROFILES_SUBDIRECTORY +
            "/" +
            key +
            "/" +
            configList[i].sub_path;

          loadedSystemConfigs[key].merge({
            [configList[i].name]: printerConfigsParsed[i],
          });
        }
      });

      const userConfigDirectory =
        orcaDataDirectory.get({ stealth: true }) +
        LOADED_USER_PROFILES_SUBDIRECTORY +
        loadedUserProfilesConfigSubdirectory;
      const userBaseDirectory =
        userConfigDirectory + LOADED_USER_PROFILES_BASE_SUBDIRECTORY;

      const inheritedConfigs: [String, T][] = await invoke(
        userConfigLoaderFunction,
        {
          path: userConfigDirectory,
        }
      );

      try {
        const baseConfigs: [String, T][] = await invoke(
          userConfigLoaderFunction,
          {
            path: userBaseDirectory,
          }
        );

        baseConfigs.forEach(([path, config]) => {
          const configWithFileName: T & fileProperty = {
            ...config,
            fileName: path.toString(),
          };
          loadedUserConfigs.merge({
            [config.name]: configWithFileName,
          });
        });
      } catch (error: any) {
        console.log("base directory does not exist, skipping");
      }

      inheritedConfigs.forEach(([path, config]) => {
        const configWithFileName: T & fileProperty = {
          ...config,
          fileName: path.toString(),
        };
        loadedUserConfigs.merge({
          [config.name]: configWithFileName,
        });
      });

      errLoadingDataPath.set(undefined);
      toast(`Loaded user ${messageKey} profiles`, { type: "success" });
    } else {
      loadedSystemConfigs.set({});
      errLoadingDataPath.set(undefined);
    }
  } catch (error: any) {
    loadedSystemConfigs.set({});
    errLoadingDataPath.set(error);
    toast(error, { type: "error" });
  }
}

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
) =>
  dataConfigLoader(
    orcaDataDirectory,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
    errLoadingDataPath,
    "printer",
    "machine_list",
    "load_all_printer_presets",
    "load_all_user_printer_profiles_in_dir",
    "/machine"
  );

export const dataFilamentConfigLoader = async (
  orcaDataDirectory: State<string | undefined>,
  loadedSystemFilamentConfigs: State<
    Record<
      string,
      Record<
        string,
        { Ok?: MinFilamentJsonSchema; Err?: string } & fileProperty
      >
    >
  >,
  loadedUserFilamentConfigs: State<
    Record<string, MinFilamentJsonSchema & fileProperty>
  >,
  errLoadingDataPath: State<string | undefined>
) =>
  dataConfigLoader(
    orcaDataDirectory,
    loadedSystemFilamentConfigs,
    loadedUserFilamentConfigs,
    errLoadingDataPath,
    "filament",
    "filament_list",
    "load_all_filament_presets",
    "load_all_user_filaments_profiles_in_dir",
    "/filament"
  );

export const dataProcessConfigLoader = async (
  orcaDataDirectory: State<string | undefined>,
  loadedSystemProcessConfigs: State<
    Record<
      string,
      Record<string, { Ok?: MinProcessJsonSchema; Err?: string } & fileProperty>
    >
  >,
  loadedUserProcessConfigs: State<
    Record<string, MinProcessJsonSchema & fileProperty>
  >,
  errLoadingDataPath: State<string | undefined>
) =>
  dataConfigLoader(
    orcaDataDirectory,
    loadedSystemProcessConfigs,
    loadedUserProcessConfigs,
    errLoadingDataPath,
    "process",
    "process_list",
    "load_all_process_presets",
    "load_all_user_process_profiles_in_dir",
    "/process"
  );

export function installedConfigLoader<
  T extends
    | MinPrinterVariantJsonSchema
    | MinFilamentJsonSchema
    | MinProcessJsonSchema
>(
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
  installedConfigs: State<
    Record<string, Record<string, { Ok?: T; Err?: string } & fileProperty>>
  >,
  instantiatedInstalledConfigs: State<
    Record<string, T & fileProperty & familyProperty>
  >,
  errLoading: State<string | undefined>,
  messageKey: string,
  configNameAndPathKey: string,
  configLoaderFunction: string
) {
  try {
    if (
      orcaInstallationPath.get({ stealth: true }) &&
      !errLoading.get({ stealth: true })
    ) {
      vendorConfigs.keys.map(async (key) => {
        const vendorConfig = vendorConfigs[key].get({ stealth: true });
        const configList = vendorConfig[
          configNameAndPathKey
        ] as ConfigNameAndPath[];
        const configsParsed: ({
          Ok?: T;
          Err?: string;
        } & fileProperty)[] = await invoke(configLoaderFunction, {
          path:
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
            "/" +
            key,
          configNameAndPaths: configList,
        });

        for (let i = 0; i < configList.length; i++) {
          configsParsed[i].fileName =
            orcaInstallationPath.get({ stealth: true }) +
            get_installed_system_profiles_subdirectory_directory(os.get()) +
            "/" +
            key +
            "/" +
            configList[i].sub_path;

          installedConfigs[key].merge({
            [configList[i].name]: configsParsed[i],
          });

          if (configsParsed[i].Ok?.instantiation) {
            const fileTempObj: fileProperty = {
              fileName: configsParsed[i].fileName,
            };
            const familyTempObj: familyProperty = { family: key };

            const tempObj: (T & fileProperty) & familyProperty = {
              ...configsParsed[i].Ok!,
              ...fileTempObj,
              ...familyTempObj,
            };

            instantiatedInstalledConfigs.merge({
              [configList[i].name]: tempObj,
            });
          }
        }
      });

      toast(`Loaded installed ${messageKey} configs`, { type: "success" });
    } else {
      installedConfigs.set({});
    }
  } catch (error: any) {
    toast(error, { type: "error" });
    console.log(error);
    installedConfigs.set({});
  }
}

export const installedPrinterConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
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
    Record<string, MinPrinterVariantJsonSchema & fileProperty & familyProperty>
  >,
  errLoadingInstallationPath: State<string | undefined>
) =>
  installedConfigLoader(
    os,
    orcaInstallationPath,
    vendorConfigs,
    installedPrinterConfigs,
    instantiatedInstalledPrinterConfigs,
    errLoadingInstallationPath,
    "printer",
    "machine_list",
    "load_all_printer_presets"
  );

export const installedFilamentConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
  installedFilamentConfigs: State<
    Record<
      string,
      Record<
        string,
        { Ok?: MinFilamentJsonSchema; Err?: string } & fileProperty
      >
    >
  >,
  instantiatedInstalledFilamentConfigs: State<
    Record<string, MinFilamentJsonSchema & fileProperty & familyProperty>
  >,
  errLoadingInstallationPath: State<string | undefined>
) =>
  installedConfigLoader(
    os,
    orcaInstallationPath,
    vendorConfigs,
    installedFilamentConfigs,
    instantiatedInstalledFilamentConfigs,
    errLoadingInstallationPath,
    "filament",
    "filament_list",
    "load_all_filament_presets"
  );

export const installedProcessConfigLoader = async (
  os: State<string>,
  orcaInstallationPath: State<string | undefined>,
  vendorConfigs: State<Record<string, VendorJsonSchema & fileProperty>>,
  installedProcessConfigs: State<
    Record<
      string,
      Record<string, { Ok?: MinProcessJsonSchema; Err?: string } & fileProperty>
    >
  >,
  instantiatedInstalledProcessConfigs: State<
    Record<string, MinProcessJsonSchema & fileProperty & familyProperty>
  >,
  errLoadingInstallationPath: State<string | undefined>
) =>
  installedConfigLoader(
    os,
    orcaInstallationPath,
    vendorConfigs,
    installedProcessConfigs,
    instantiatedInstalledProcessConfigs,
    errLoadingInstallationPath,
    "process",
    "process_list",
    "load_all_process_presets"
  );

export const get_installed_system_profiles_subdirectory_directory = (
  os: string
) => {
  if (os == "darwin") return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_MACOS;
  else return INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY;
};

export const findConfig = (
  configName: string,
  type: ConfigType,
  location: ConfigLocationType,
  family?: string
) => {
  const neededConfigs = getRelevantConfigsFromType(type);

  switch (location) {
    case "user":
      return neededConfigs!.loadedUserConfigs[configName].get({
        stealth: true,
      });

    case "installed": {
      if (family)
        return {
          ...neededConfigs!.installedConfigs[family][configName].get({
            stealth: true,
          }),
          family: family,
        };
      else {
        const instantiatedConfig = neededConfigs!.instantiatedInstalledConfigs[
          configName
        ].get({ stealth: true });

        if (instantiatedConfig)
          return {
            ...neededConfigs!.installedConfigs[instantiatedConfig.family][
              configName
            ].get({ stealth: true }),
            family: instantiatedConfig.family,
          };
        break;
      }
    }

    case "loaded_system": {
      if (family)
        return {
          ...neededConfigs!.loadedSystemConfigs[family][configName].get({
            stealth: true,
          }),
          family: family,
        };
      else {
        const instantiatedConfig = neededConfigs!.instantiatedInstalledConfigs[
          configName
        ].get({ stealth: true });

        if (instantiatedConfig)
          return {
            ...neededConfigs!.loadedSystemConfigs[instantiatedConfig.family][
              configName
            ].get({ stealth: true }),
            family: instantiatedConfig.family,
          };
        break;
      }
    }
  }
};

export const deinherit_and_load_all_props: any = async <
  T extends PrinterVariantJsonSchema | FilamentJsonSchema | ProcessJsonSchema
>(
  configName: string,
  type: ConfigType,
  family?: string,
  level = 0
) => {
  try {
    let configFile: string | undefined = undefined;
    const warnings = [] as Warning[];

    const loadedUserPrinterConfigRes = findConfig(
      configName,
      type,
      "user",
      family
    );

    if (loadedUserPrinterConfigRes) {
      configFile = loadedUserPrinterConfigRes.fileName;
    } else {
      const instantiatedLoadedSystemConfigRes = findConfig(
        configName,
        type,
        "loaded_system",
        family
      ) as (T & fileProperty & familyProperty) | undefined;

      if (instantiatedLoadedSystemConfigRes) {
        configFile = instantiatedLoadedSystemConfigRes.fileName;
        family = instantiatedLoadedSystemConfigRes.family;
      } else {
        const instantiatedLoadedUserConfigRes = findConfig(
          configName,
          type,
          "user",
          family
        ) as (T & fileProperty & familyProperty) | undefined;

        warnings.push({
          text: "could not find ancestor in loaded presets. This means the config might not appear in OrcaSlicer.",
          type: "warning",
        });

        if (instantiatedLoadedUserConfigRes) {
          configFile = instantiatedLoadedUserConfigRes.fileName;
          family = instantiatedLoadedUserConfigRes.family;
        } else {
          throw "Could not find parent config " + configName;
        }
      }
    }

    const res: T = await invoke("load_generic_preset", {
      path: configFile,
    });

    if (res.inherits) {
      let printerFamily = family;

      const inherited_props = await deinherit_and_load_all_props(
        res.inherits,
        type,
        printerFamily,
        level + 1
      );

      const filteredRes = Object.fromEntries(
        Object.entries(res).filter(([_, v]) => v != null)
      );

      const keyDetails = Object.keys(filteredRes).reduce((acc, key) => {
        acc[key] = {
          configName: res.name,
          level: level,
          family: family,
          file: configFile,
        };
        return acc;
      }, {} as Record<string, KeyDetails>);

      return {
        res: { ...inherited_props.res, ...filteredRes },
        keyDetails: { ...inherited_props.keyDetails, ...keyDetails },
        warnings: [...inherited_props.warnings, ...warnings],
      };
    } else {
      const keyDetails = Object.keys(res).reduce((acc, key) => {
        acc[key] = {
          configName: res.name,
          level: level,
          family: family,
          file: configFile,
        };
        return acc;
      }, {} as Record<string, KeyDetails>);

      return { res, keyDetails, warnings };
    }
  } catch (error: any) {
    throw "Could not complete inheritance hierarchy: " + error;
  }
};

export const updateUuid = (name: string) => {
  const splitString = (name as string).split("_");

  if (splitString.length > 1) {
    const endId = splitString[splitString.length - 1];
    if (isUuid(endId))
      return (
        splitString.slice(0, splitString.length - 1).join("_") + "_" + uuidv4()
      );
  }

  return name + "_" + uuidv4();
};

export function sanitizeWindowLabel(input: string): string {
  return input.replace(/[^a-zA-Z0-9\-\/:_]/g, "_");
}

export function getRelevantConfigsFromType(type: ConfigType) {
  const printerConfigs = {
    installedConfigs: globalState.installedPrinterConfigs,
    instantiatedInstalledConfigs:
      globalState.instantiatedInstalledPrinterConfigs,
    loadedSystemConfigs: globalState.loadedSystemPrinterConfigs,
    loadedUserConfigs: globalState.loadedUserPrinterConfigs,
  };

  const filamentConfigs = {
    installedConfigs: globalState.installedFilamentConfigs,
    instantiatedInstalledConfigs:
      globalState.instantiatedInstalledFilamentConfigs,
    loadedSystemConfigs: globalState.loadedSystemFilamentConfigs,
    loadedUserConfigs: globalState.loadedUserFilamentConfigs,
  };

  const processConfigs = {
    installedConfigs: globalState.installedProcessConfigs,
    instantiatedInstalledConfigs:
      globalState.instantiatedInstalledProcessConfigs,
    loadedSystemConfigs: globalState.loadedSystemProcessConfigs,
    loadedUserConfigs: globalState.loadedUserProcessConfigs,
  };

  const neededConfigs = (() => {
    switch (type) {
      case "printer":
        return printerConfigs;

      case "filament":
        return filamentConfigs;

      case "process":
        return processConfigs;
    }
  })();

  return neededConfigs;
}

export async function deinherit_config_by_type(
  configName: string,
  type: ConfigType,
  family?: string
) {
  const res = await deinherit_and_load_all_props(configName, type, family);

  return res;
}

export function editConfigFile(
  name: string,
  type: ConfigType,
  fileName: string,
  navigate: NavigateFunction,
  family?: string
) {
  const { editWindowState } = globalState;

  const encodedFileName = encodeURIComponent(fileName);

  if (!editWindowState[fileName].get({ stealth: true }))
    editWindowState[fileName].set({
      fileName: fileName,
      type: type,
      name: name,
      family: family,
      properties: { res: {}, keyDetails: {}, warnings: [] },
      changedProps: {},
      knownKeys: [],
      unknownKeys: [],
    });

  navigate(`/edit?fileName=${encodedFileName}`);
}

export const folderOpener = (path: string) => {
  invoke("check_file", { path }).then((exists) => {
    if (exists) {
      invoke("show_in_folder", { path });
    } else {
      toast(`${path} does not exist`, { type: "error" });
    }
  });
};
