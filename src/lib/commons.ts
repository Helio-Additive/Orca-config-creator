import { State } from "@hookstate/core";
import { homeDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import { validate as isUuid, v4 as uuidv4 } from "uuid";
import { ConfigNameAndPath } from "./bindings/ConfigNameAndPath";
import { FilamentJsonSchema } from "./bindings/FilamentJsonSchema";
import { MinFilamentJsonSchema } from "./bindings/MinFilamentJsonSchema";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { MinProcessJsonSchema } from "./bindings/MinProcessJsonSchema";
import { PrinterVariantJsonSchema } from "./bindings/PrinterVariantJsonSchema";
import { ProcessJsonSchema } from "./bindings/ProcessJsonSchema";
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

export enum InheritanceStatus {
  OK,
  BROKEN,
  CIRCULAR,
}

export type ConfigLocationType = "installed" | "loaded_system" | "user";

export type ConfigType =
  | "printer"
  | "printer-model"
  | "filament"
  | "process"
  | "vendor";

export const checkKeyInState = (
  key: string[],
  state: State<Record<string, any>>
) => {
  try {
    let tempState: any = state;
    for (let i = 0; i < key.length; i++) {
      const el = key[i];
      if (!tempState.keys.includes(el)) return false;

      tempState = tempState[el];
    }
    return true;
  } catch (e: any) {
    return false;
  }
};

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

export const modelConfigLoader = async () => {
  const os = globalState.os;
  const orcaInstallationPath = globalState.orcaInstallationPath;
  const vendorConfigs = globalState.vendorConfigs;
  const modelConfigs = globalState.modelConfigs;
  const errLoadingInstallationPath = globalState.errLoadingInstallationPath;

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
  type: ConfigType,
  propKey: string,
  systemConfigLoaderFunction: string,
  userConfigLoaderFunction: string,
  loadedUserProfilesConfigSubdirectory: string
) {
  const orcaDataDirectory = globalState.orcaDataDirectory;
  const relevantConfigs = getRelevantConfigsFromType(type);
  const loadedSystemConfigs = relevantConfigs!.loadedSystemConfigs! as State<
    Record<string, Record<string, { Ok?: T; Err?: string } & fileProperty>>
  >;
  const loadedUserConfigs = relevantConfigs!.loadedUserConfigs! as State<
    Record<string, T & fileProperty>
  >;

  loadedSystemConfigs.set({});
  loadedUserConfigs.set({});

  const errLoadingDataPath = globalState.errLoadingDataPath;

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
      toast(`Loaded user ${type} profiles`, { type: "success" });
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

export const dataPrinterConfigLoader = async () =>
  dataConfigLoader(
    "printer",
    "machine_list",
    "load_all_printer_presets",
    "load_all_user_printer_profiles_in_dir",
    "/machine"
  );

export const dataFilamentConfigLoader = async () =>
  dataConfigLoader(
    "filament",
    "filament_list",
    "load_all_filament_presets",
    "load_all_user_filaments_profiles_in_dir",
    "/filament"
  );

export const dataProcessConfigLoader = async () =>
  dataConfigLoader(
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
  type: ConfigType,
  configNameAndPathKey: string,
  configLoaderFunction: string
) {
  const os = globalState.os;
  const orcaInstallationPath = globalState.orcaInstallationPath;
  const vendorConfigs = globalState.vendorConfigs;
  const relevantConfigs = getRelevantConfigsFromType(type);
  const installedConfigs = relevantConfigs!.installedConfigs! as State<
    Record<string, Record<string, { Ok?: T; Err?: string } & fileProperty>>
  >;
  const instantiatedInstalledConfigs = relevantConfigs!
    .instantiatedInstalledConfigs! as State<
    Record<string, T & fileProperty & familyProperty>
  >;
  const errLoading = globalState.errLoadingInstallationPath;

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

      toast(`Loaded installed ${type} configs`, { type: "success" });
    } else {
      installedConfigs.set({});
    }
  } catch (error: any) {
    toast(error, { type: "error" });
    console.log(error);
    installedConfigs.set({});
  }
}

export const installedPrinterConfigLoader = async () =>
  installedConfigLoader("printer", "machine_list", "load_all_printer_presets");

export const installedFilamentConfigLoader = async () =>
  installedConfigLoader(
    "filament",
    "filament_list",
    "load_all_filament_presets"
  );

export const installedProcessConfigLoader = async () =>
  installedConfigLoader("process", "process_list", "load_all_process_presets");

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
        return checkKeyInState(
          [family, configName],
          neededConfigs!.installedConfigs
        )
          ? {
              ...neededConfigs!.installedConfigs[family][configName].get({
                stealth: true,
              }),
              family: family,
            }
          : undefined;
      else {
        const instantiatedConfig = neededConfigs!.instantiatedInstalledConfigs[
          configName
        ].get({ stealth: true });

        return instantiatedConfig
          ? {
              ...neededConfigs!.installedConfigs[instantiatedConfig.family][
                configName
              ].get({ stealth: true }),
              family: instantiatedConfig.family,
            }
          : undefined;
        break;
      }
    }

    case "loaded_system": {
      if (family)
        return checkKeyInState(
          [family, configName],
          neededConfigs!.loadedSystemConfigs
        )
          ? {
              ...neededConfigs!.loadedSystemConfigs[family][configName].get({
                stealth: true,
              }),
              family: family,
            }
          : undefined;
      else {
        const instantiatedConfig = neededConfigs!.instantiatedInstalledConfigs[
          configName
        ].get({ stealth: true });

        return instantiatedConfig
          ? {
              ...neededConfigs!.loadedSystemConfigs[instantiatedConfig.family][
                configName
              ].get({ stealth: true }),
              family: instantiatedConfig.family,
            }
          : undefined;
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
  level = 0,
  checkedConfigs: string[] = []
) => {
  if (checkedConfigs.includes(configName))
    throw "Circular dependency found, cannot be deinherited";

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
        const instantiatedInstalledConfigRes = findConfig(
          configName,
          type,
          "installed",
          family
        ) as (T & fileProperty & familyProperty) | undefined;

        warnings.push({
          text: "could not find ancestor in loaded presets. This means the config might not appear in OrcaSlicer.",
          type: "warning",
        });

        if (instantiatedInstalledConfigRes) {
          configFile = instantiatedInstalledConfigRes.fileName;
          family = instantiatedInstalledConfigRes.family;
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
        level + 1,
        [configName, ...checkedConfigs]
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
  location: ConfigLocationType,
  navigate: NavigateFunction,
  family?: string,
  replace = false
) {
  const encodedFileName = encodeURIComponent(fileName);

  const url =
    `/edit?fileName=${encodedFileName}&type=${type}&name=${name}&location=${location}` +
    (family ? `&family=${family}` : "");

  navigate(url, { replace: replace });
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

export function findAvailableConfigs(
  findType: ConfigType,
  location: ConfigLocationType,
  family?: string
) {
  const neededConfigs = getRelevantConfigsFromType(findType);

  switch (location) {
    case "user": {
      const loadedSystemConfigs =
        neededConfigs!.loadedSystemConfigs.keys.flatMap((familyName) =>
          neededConfigs!.loadedSystemConfigs[familyName].keys.filter(
            (configName) =>
              neededConfigs!.loadedSystemConfigs[familyName][configName].get({
                stealth: true,
              }).Ok?.instantiation === "true"
          )
        );
      const userConfigs = neededConfigs!.loadedUserConfigs.keys;

      return [...loadedSystemConfigs, ...userConfigs];
    }

    case "loaded_system": {
      return neededConfigs?.loadedSystemConfigs[family!].keys;
    }

    case "installed": {
      return neededConfigs?.installedConfigs[family!].keys;
    }
  }
}

export async function updateVendorConfigEntry(
  family: string,
  type: ConfigType,
  oldName: string,
  newName: string
) {
  const vendorConfig = globalState.vendorConfigs[family].get({ stealth: true });

  const vendorConfigKeyName = (() => {
    switch (type) {
      case "printer":
        return "machine_list";

      case "filament":
        return "filament_list";

      case "process":
        return "process_list";

      case "printer-model":
        return "machine_model_list";
    }
  })()!;

  const relevantConfigList = vendorConfig[vendorConfigKeyName];

  const updatedConfigs = relevantConfigList!.map((el) => {
    if (el.name !== oldName) return el;
    else {
      const subDirectory = el.sub_path.split("/")[0];
      return {
        name: newName,
        sub_path: subDirectory + "/" + newName + "/json",
      };
    }
  });

  const path = vendorConfig.fileName;

  const readVendorConfig = await invoke<VendorJsonSchema>(
    "load_all_system_vendor_profiles",
    { path }
  );

  readVendorConfig[vendorConfigKeyName] = updatedConfigs;

  await invoke("write_to_file", {
    path,
    content: JSON.stringify(readVendorConfig),
  });

  switch (type) {
    case "printer":
      await installedPrinterConfigLoader();
      break;

    case "filament":
      await installedFilamentConfigLoader();
      break;

    case "process":
      await installedProcessConfigLoader();
      break;

    case "printer-model":
      await modelConfigLoader();
      break;
  }
}

//async function updateVendorFile(family: string) {}

export async function renameConfig(
  oldName: string,
  newName: string,
  type: ConfigType,
  location: ConfigLocationType,
  family?: string
) {
  const path = findConfig(oldName, type, location, family)!.fileName;

  try {
    const props = await invoke<{ name: string } & fileProperty>(
      "load_generic_preset",
      {
        path,
      }
    );

    props.name = newName;

    await invoke("write_to_file", { path, content: JSON.stringify(props) });
    const newPath = await invoke<string>("rename_config", { path, newName });

    if (location === "installed") {
      updateVendorConfigEntry(family!, type, oldName, newName);
    } else {
      switch (type) {
        case "printer":
          await dataPrinterConfigLoader();
          break;

        case "filament":
          await dataFilamentConfigLoader();
          break;

        case "process":
          await dataProcessConfigLoader();
          break;
      }
    }

    return newPath;
  } catch (error: any) {
    throw error;
  }
}
