import { none, State } from "@hookstate/core";
import {
  ConfigLocationType,
  ConfigType,
  editConfigFile,
  getDirectoryFromTypeAndLocation,
  refreshConfigs,
  renameConfig,
} from "./commons";
import { globalStateObject } from "./state-store";
import { NavigateFunction } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";

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
  const keyDetails = editWindowState[fileName].properties.keyDetails;
  const changedProps = editWindowState[fileName].changedProps;

  let newName: string | undefined = undefined;
  if (changedProps.keys.includes("name")) {
    newName = changedProps["name"].get({ stealth: true }) as string;
  }

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

  await invoke("write_to_file", {
    path: !newFile
      ? fileName
      : getDirectoryFromTypeAndLocation(type, location, family) +
        newName +
        ".json",
    content: JSON.stringify(newProps, null, 2),
  })
    .then(() => {
      toast("Wrote new configuration to file", { type: "success" });
      changedProps.set({});
      editWindowState[fileName].deleteKeys.set([]);
    })
    .catch((error: any) => {
      toast(error.toString(), { type: "error" });
    });

  if (newName) {
    try {
      const name = props["name"].get({ stealth: true }) as string;
      let newFileName = name;
      if (!newFile) {
        newFileName = await renameConfig(name, newName, type, location, family);
      }

      refreshConfigs(type, location).then(() => {
        editConfigFile(
          newName,
          type,
          newFileName,
          location,
          navigate,
          family,
          true
        );
      });
    } catch (error: any) {
      toast(error.toString(), { type: "error" });
    }
  }
}
