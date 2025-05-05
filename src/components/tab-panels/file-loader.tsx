import { State, useHookstate } from "@hookstate/core";
import { open } from "@tauri-apps/api/dialog";
import { globalState } from "../../lib/state-store";
import FieldButton from "./field-button";
import InputComponent from "./input-component";
import { getRelevantConfigsFromType } from "../../lib/commons";
import { invoke } from "@tauri-apps/api/tauri";

export default function FileLoader() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    errLoadingInstallationPath,
    errLoadingDataPath,
    os,
  } = useHookstate(globalState);

  const handleClick = async (
    stateObj: State<string | undefined, {}>,
    getApp: boolean = false
  ) => {
    const selected = await open({
      directory: !getApp,
      multiple: false,
    });

    if (typeof selected === "string") {
      stateObj.set(selected);
    }
  };

  const clearPath = (stateObj: State<string | undefined, {}>) => {
    stateObj.set(undefined);
  };

  return (
    <>
      <InputComponent
        label="Orca Installation Directory"
        type="button"
        onClick={() => handleClick(orcaInstallationPath, os.get() == "darwin")}
        value={orcaInstallationPath.get()}
        placeholder="Pick a directory/folder"
        rightChild={
          <FieldButton
            text="Clear"
            onClick={() => clearPath(orcaInstallationPath)}
          />
        }
        err={errLoadingInstallationPath.get()}
        allowEdit
      />
      <InputComponent
        label="Orca Data Directory"
        type="button"
        onClick={() => handleClick(orcaDataDirectory)}
        value={orcaDataDirectory.get()}
        placeholder="Pick a directory/folder"
        rightChild={
          <FieldButton
            text="Clear"
            onClick={() => clearPath(orcaDataDirectory)}
          />
        }
        err={errLoadingDataPath.get()}
        allowEdit
      />
      <button
        className="text-white"
        onClick={() => {
          const neededConfigs = getRelevantConfigsFromType("printer");

          const loadedSystemConfigs =
            neededConfigs!.installedConfigs.keys.flatMap((familyName) =>
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

          const allFiles = [...loadedSystemConfigs, ...userConfigs];

          invoke("find_possible_values", {
            filesToCheck: allFiles,
            propName: "inherits2",
          }).then(console.log);
        }}
      >
        Hello
      </button>
    </>
  );
}
