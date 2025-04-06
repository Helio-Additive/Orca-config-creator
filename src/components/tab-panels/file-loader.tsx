import { State, useHookstate } from "@hookstate/core";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { VendorJsonSchema } from "../../lib/bindings/VendorJsonSchema";
import { globalState } from "../../lib/state-store";
import FieldButton from "./field-button";
import InputComponent from "./input-component";

export default function FileLoader() {
  const { orcaInstallationPath, orcaDataDirectory, vendorConfigs } =
    useHookstate(globalState);

  const [errLoadingInstallationPath, setErrorLoadingInstallationPath] =
    useState(undefined as string | undefined);

  const handleClick = async (stateObj: State<string | undefined, {}>) => {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (typeof selected === "string") {
      stateObj.set(selected);
    }
  };

  const clearPath = (stateObj: State<string | undefined, {}>) => {
    stateObj.set(undefined);
  };

  useEffect(() => {
    const config_loader = async () => {
      try {
        if (orcaInstallationPath.get()) {
          const vendorConfigsRead: Record<string, VendorJsonSchema> =
            await invoke("load_all_system_vendor_profiles", {
              path: orcaInstallationPath.get() + "/resources/profiles",
            });

          console.log(vendorConfigsRead);
          vendorConfigs.set(vendorConfigsRead);
          setErrorLoadingInstallationPath(undefined);
        } else {
          vendorConfigs.set({});
          setErrorLoadingInstallationPath(undefined);
        }
      } catch (error: any) {
        vendorConfigs.set({});
        setErrorLoadingInstallationPath(error);
      }
    };

    config_loader();
  }, [orcaInstallationPath]);

  useEffect(() => {}, [vendorConfigs]);

  return (
    <>
      <InputComponent
        label="Orca Installation Directory"
        type="button"
        onClick={() => handleClick(orcaInstallationPath)}
        value={orcaInstallationPath.get()}
        placeholder="Pick a directory/folder"
        rightChildren={[
          <FieldButton
            text="Clear"
            onClick={() => clearPath(orcaInstallationPath)}
          />,
        ]}
        err={errLoadingInstallationPath}
      />
      <InputComponent
        label="Orca Data Directory"
        type="button"
        onClick={() => handleClick(orcaDataDirectory)}
        value={orcaDataDirectory.get()}
        placeholder="Pick a directory/folder"
        rightChildren={[
          <FieldButton
            text="Clear"
            onClick={() => clearPath(orcaDataDirectory)}
          />,
        ]}
      />
    </>
  );
}
