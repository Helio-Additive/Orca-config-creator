import { none, State } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import {
  checkIsRequired,
  ConfigLocationType,
  ConfigType,
  createVendorConfigEntry,
  deinherit_config_by_type,
  editConfigFile,
  findConfig,
  getArrayFromDelimitedString,
  getDelimitedStringFromArray,
  getDirectoryFromTypeAndLocation,
  getPropMapFromType,
  getRelevantConfigsFromTypePFP,
  refreshConfigs,
  renameConfig,
  renameVendorConfigEntry,
} from "./commons";
import { globalState, globalStateObject } from "./state-store";
import { ConfigNameAndPath } from "./bindings/ConfigNameAndPath";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";

function refreshAndReload(
  name: string,
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  navigate: NavigateFunction,
  family?: string
) {
  refreshConfigs(type, location).then(() => {
    editConfigFile(name, type, fileName, location, navigate, family, true);
  });
}
async function writeToFile(
  path: string,
  props: Record<string, unknown>,
  editWindowStateKey: string,
  editWindowState: State<typeof globalStateObject.editWindowState>
) {
  const changedProps = editWindowState[editWindowStateKey].changedProps;

  await invoke("write_to_file", {
    path,
    content: JSON.stringify(props, null, 2),
  })
    .then(() => {
      toast("Wrote new configuration to file", { type: "success" });
      changedProps.set({});
      editWindowState[editWindowStateKey].deleteKeys.set([]);
    })
    .catch((error: any) => {
      toast(error.toString(), { type: "error" });
    });
}

function getKeysValuesToSave(
  fileName: string,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>
) {
  const props = editWindowState[fileName].properties.res;
  const keyDetails = editWindowState[fileName].properties.keyDetails;
  const changedProps = editWindowState[fileName].changedProps;

  const newProps = {
    ...Object.fromEntries(
      Object.entries(props.get({ stealth: true })).filter(
        ([key, _]) =>
          keyDetails[key].get({ stealth: true }).level === 0 &&
          !editWindowState[fileName].deleteKeys
            .get({ stealth: true })
            .includes(key)
      )
    ),
    ...changedProps.get({ stealth: true }),
  };

  return newProps;
}

export async function saveFile(
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>,
  navigate: NavigateFunction,
  family?: string,
  newFile?: boolean
) {
  const props = editWindowState[fileName].properties.res;
  const changedProps = editWindowState[fileName].changedProps;

  let newName: string | undefined = undefined;
  if (changedProps.keys.includes("name")) {
    newName = changedProps["name"].get({ stealth: true }) as string;
  }
  try {
    if (!newName && !newFile)
      await saveFileWithoutRenameOrCreation(fileName, editWindowState);
    else if (newFile) {
      const newFileName =
        getDirectoryFromTypeAndLocation(type, location, family) +
        newName +
        ".json";
      await saveNewFile(
        newName!,
        type,
        fileName,
        newFileName,
        location,
        editWindowState,
        family
      );
      refreshAndReload(newName!, newFileName, type, location, navigate, family);
    } else if (newName && !newFile) {
      const name = props["name"].get({ stealth: true }) as string;
      const newFileName = await saveAndRenameFile(
        name,
        newName,
        type,
        fileName,
        location,
        editWindowState,
        family
      );
      refreshAndReload(newName, newFileName, type, location, navigate, family);
    }
  } catch (error: any) {
    toast(error.toString(), { type: "error" });
  }
}

async function saveFileWithoutRenameOrCreation(
  fileName: string,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>
) {
  const newProps = getKeysValuesToSave(fileName, editWindowState);
  await writeToFile(fileName, newProps, fileName, editWindowState);
}

async function saveNewFile(
  name: string,
  type: ConfigType,
  fileName: string,
  newFileName: string,
  location: ConfigLocationType,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>,
  family?: string
) {
  if (location === "user") {
    const newProps = getKeysValuesToSave(fileName, editWindowState);
    await writeToFile(newFileName, newProps, fileName, editWindowState);
  } else if (location === "installed") {
    const newProps = getKeysValuesToSave(fileName, editWindowState);
    await writeToFile(newFileName, newProps, fileName, editWindowState);
    await createVendorConfigEntry(family!, type, name);
    if (type === "printer") {
      await addNewVariantToModel(
        family!,
        newProps["printer_model"] as string,
        newProps["printer_variant"] as string
      );
    }
  } else {
    toast("Could not save file", { type: "error" });
  }
}

async function saveAndRenameFile(
  name: string,
  newName: string,
  type: ConfigType,
  fileName: string,
  location: ConfigLocationType,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>,
  family?: string
) {
  if (location === "user") {
    const newProps = getKeysValuesToSave(fileName, editWindowState);
    await writeToFile(fileName, newProps, fileName, editWindowState);
    const newFileName = await renameConfig(
      name,
      newName,
      type,
      location,
      family
    );

    return newFileName;
  } else if (location === "installed") {
    const newProps = getKeysValuesToSave(fileName, editWindowState);
    await writeToFile(fileName, newProps, fileName, editWindowState);
    const newFileName = await renameConfig(
      name,
      newName,
      type,
      location,
      family
    );

    await renameVendorConfigEntry(family!, type, name, newName);
    await refreshConfigs("vendor", "installed");

    toast("reloaded vendor configs", { type: "success" });
    return newFileName;
  } else {
    toast("Could not save file", { type: "error" });
    throw "Could not save file";
  }
}

export function getFilesToSearch(type: ConfigType) {
  if (type === "printer" || type === "filament" || type === "process") {
    const neededConfigs = getRelevantConfigsFromTypePFP(type);

    const installedConfigs = neededConfigs!.installedConfigs.keys.flatMap(
      (familyName) =>
        neededConfigs!.installedConfigs[familyName].keys.map(
          (configName) =>
            neededConfigs!.installedConfigs[familyName][configName].get({
              stealth: true,
            }).fileName
        )
    );

    const userConfigs = neededConfigs!.loadedUserConfigs.keys.map((key) =>
      neededConfigs!.loadedUserConfigs[key].fileName.get({
        stealth: true,
      })
    );

    return [...installedConfigs, ...userConfigs];
  } else if (type === "vendor") {
    const installedConfigs = globalState.installedVendorConfigs.keys.map(
      (vendor) =>
        globalState.installedVendorConfigs[vendor].get({ stealth: true })
          .fileName
    );

    return installedConfigs;
  } else if (type === "printer-model") {
    const installedConfigs = globalState.installedModelConfigs.keys.flatMap(
      (familyName) =>
        globalState.installedModelConfigs[familyName].keys.map(
          (configName) =>
            globalState.installedModelConfigs[familyName][configName].get({
              stealth: true,
            }).fileName
        )
    );

    return installedConfigs;
  }
}

export function processValueAndGetArray(
  value: unknown,
  changedValue: unknown,
  delimiter?: string
) {
  if (delimiter) {
    return getArrayFromDelimitedString(
      (changedValue ?? value) as string | undefined,
      delimiter
    );
  } else {
    return (changedValue as string[]) ?? (value as string[]);
  }
}

export function addNewArrayValue(
  fileName: string,
  key: string,
  arrayValue: string[] | ConfigNameAndPath[] | undefined,
  delimiter?: string
) {
  {
    const { editWindowState } = globalState;
    const changedProperty = editWindowState[fileName].changedProps[key].get({
      stealth: true,
    });

    if (!delimiter) {
      if (changedProperty)
        editWindowState[fileName].changedProps[key].merge([
          arrayValue![arrayValue!.length - 1],
        ]);
      else if (arrayValue)
        editWindowState[fileName].changedProps[key].set([
          ...arrayValue!,
          arrayValue![arrayValue!.length - 1],
        ]);
      else editWindowState[fileName].changedProps[key].set([undefined]);
    } else {
      if (changedProperty)
        editWindowState[fileName].changedProps[key].set((v: string) =>
          v ? v + delimiter : ";"
        );
      else {
        const v = editWindowState[fileName].properties.res[key].get({
          stealth: true,
        });

        editWindowState[fileName].changedProps[key].set(
          v ? v + delimiter : ";"
        );
      }
    }
  }
}

export function removeArrayValue(
  fileName: string,
  key: string,
  idx: number,
  delimiter?: string
) {
  const { editWindowState } = globalState;
  const changedProperty = editWindowState[fileName].changedProps[key].get({
    stealth: true,
  });

  if (!delimiter) {
    if (changedProperty) {
      editWindowState[fileName].changedProps[key].merge({ [idx]: none });
    } else {
      const arr = [
        ...(editWindowState[fileName].properties.res[key].get({
          stealth: true,
        }) as unknown[]),
      ];
      arr.splice(idx, 1);
      editWindowState[fileName].changedProps[key].set(arr);
    }
  } else {
    if (changedProperty) {
      const arr = getArrayFromDelimitedString(
        changedProperty as string,
        delimiter
      );
      arr.splice(idx, 1);
      editWindowState[fileName].changedProps[key].set(
        getDelimitedStringFromArray(arr, delimiter)
      );
    } else {
      const arr = getArrayFromDelimitedString(
        editWindowState[fileName].properties.res[key].get({
          stealth: true,
        }) as string,
        delimiter
      );
      arr.splice(idx, 1);
      editWindowState[fileName].changedProps[key].set(
        getDelimitedStringFromArray(arr, delimiter)
      );
    }
  }
}

export async function addNewVariantToModel(
  family: string,
  modelName: string,
  variant: string
) {
  const modelConfig = findConfig(
    modelName,
    "printer-model",
    "installed",
    family
  );

  if (modelConfig) {
    const res: MinPrinterModelJsonSchema = await invoke("load_generic_preset", {
      path: modelConfig.fileName,
    });

    const variantArray = res.nozzle_diameter
      .split(";")
      .filter((el) => el && el.length > 0);
    variantArray.push(variant);

    const newVariantString = variantArray.join(";");

    res.nozzle_diameter = newVariantString;

    await invoke("write_to_file", {
      path: modelConfig.fileName,
      content: JSON.stringify(res, null, 2),
    });
  }
}

export async function removeVariantFromModel(
  family: string,
  modelName: string,
  variant: string
) {
  const modelConfig = findConfig(
    modelName,
    "printer-model",
    "installed",
    family
  );

  if (modelConfig) {
    const res: MinPrinterModelJsonSchema = await invoke("load_generic_preset", {
      path: modelConfig.fileName,
    });

    const variantArray = res.nozzle_diameter
      .split(";")
      .filter((el) => el && el.length > 0 && el !== variant);

    const newVariantString = variantArray.join(";");

    res.nozzle_diameter = newVariantString;

    await invoke("write_to_file", {
      path: modelConfig.fileName,
      content: JSON.stringify(res, null, 2),
    });

    await refreshConfigs("printer-model", "installed");
  }
}

export function initializeWindowState(
  name: string,
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  family?: string
) {
  const { editWindowState } = globalState;

  editWindowState[fileName].set({
    initialLoadCompleted: false,
    fileName: fileName,
    type: type,
    name: name,
    family: family,
    properties: {
      res: {},
      keyDetails: {},
      warnings: {},
    },
    changedProps: {},
    deleteKeys: [],
    knownKeys: new Set(),
    unknownKeys: new Set(),
    location: location,
  });
}

export function loadExistingConfigProps(
  name: string,
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  family?: string
) {
  const propMap = getPropMapFromType(type);

  const { editWindowState } = globalState;
  deinherit_config_by_type(name, type, location, family)
    .then((res) => {
      const allKeysInRes = Object.keys(res.res);

      const knownKeysTemp = new Set(
        Object.keys(propMap).filter((el) => allKeysInRes.includes(el))
      );
      const unknownKeysTemp = new Set(
        allKeysInRes.filter((el) => !knownKeysTemp.has(el))
      );

      Object.keys(propMap)
        .filter((el) => checkIsRequired(location, propMap[el]))
        .forEach((el) => knownKeysTemp.add(el));

      editWindowState[fileName].knownKeys.set(knownKeysTemp);
      editWindowState[fileName].unknownKeys.set(unknownKeysTemp);

      editWindowState[fileName].properties.set(res);
      editWindowState[fileName].initialLoadCompleted.set(true);
    })
    .catch((error: any) => toast(error.toString(), { type: "error" }));
}

export async function loadNewConfigProps(
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  originalName?: string,
  originalFamily?: string
) {
  const propMap = getPropMapFromType(type);

  const { editWindowState } = globalState;

  const knownKeysTemp = Object.keys(propMap).filter((el) =>
    checkIsRequired(location, propMap[el])
  );

  const changedPropsTemp = knownKeysTemp.reduce((acc, el) => {
    acc[el] = structuredClone(propMap[el].default);
    return acc;
  }, {} as Record<string, any>);

  changedPropsTemp["type"] = type;
  editWindowState[fileName].merge({
    changedProps: changedPropsTemp,
    knownKeys: new Set(knownKeysTemp),
    initialLoadCompleted: true,
  });

  if (originalName) {
    const originalProps = await deinherit_config_by_type(
      originalName,
      type,
      location,
      originalFamily
    );
    const propsToSet = Object.fromEntries(
      Object.entries(originalProps.res).filter(
        ([key, _]) => originalProps.keyDetails[key].level === 0
      )
    );

    propsToSet["name"] = propsToSet["name"] + " Copy";

    editWindowState[fileName].knownKeys.set((v) => {
      const keysSet = new Set(v);

      const knownKeys = Object.keys(propsToSet).filter((el) =>
        Object.keys(propMap).includes(el)
      );
      knownKeys.forEach((el) => keysSet.add(el));

      return keysSet;
    });

    editWindowState[fileName].unknownKeys.set((v) => {
      const keysSet = new Set(v);

      const knownKeys = Object.keys(propsToSet).filter(
        (el) => !Object.keys(propMap).includes(el)
      );
      knownKeys.forEach((el) => keysSet.add(el));

      return keysSet;
    });

    editWindowState[fileName].merge({ changedProps: propsToSet });
  }
}
