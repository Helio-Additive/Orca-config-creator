import { State } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ConfigLocationType,
  ConfigType,
  editConfigFile,
  getDirectoryFromTypeAndLocation,
  refreshConfigs,
  renameConfig,
  updateVendorConfigEntry,
} from "./commons";
import { globalStateObject } from "./state-store";

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
      await saveNewFile(fileName, newFileName, location, editWindowState);
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
  fileName: string,
  newFileName: string,
  location: ConfigLocationType,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>
) {
  if (location === "user") {
    const newProps = getKeysValuesToSave(fileName, editWindowState);
    await writeToFile(newFileName, newProps, fileName, editWindowState);
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

    await updateVendorConfigEntry(family!, type, name, newName);
    await refreshConfigs("vendor", "installed");

    toast("reloaded vendor configs", { type: "success" });
    return newFileName;
  } else {
    toast("Could not save file", { type: "error" });
    throw "Could not save file";
  }
}
