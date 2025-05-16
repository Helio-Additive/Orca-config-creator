import { none, State } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ConfigLocationType,
  ConfigType,
  createVendorConfigEntry,
  editConfigFile,
  getArrayFromDelimitedString,
  getDelimitedStringFromArray,
  getDirectoryFromTypeAndLocation,
  getRelevantConfigsFromTypePFP,
  refreshConfigs,
  renameConfig,
  renameVendorConfigEntry,
} from "./commons";
import { globalState, globalStateObject } from "./state-store";
import { ConfigNameAndPath } from "./bindings/ConfigNameAndPath";

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
    createVendorConfigEntry(family!, type, name);
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
    return ((changedValue as string) ?? (value as string)).split(delimiter);
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
        editWindowState[fileName].changedProps[key].set((v: string) => v + ";");
      else
        editWindowState[fileName].changedProps[key].set(
          editWindowState[fileName].properties.res[key].get({
            stealth: true,
          }) + ";"
        );
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
