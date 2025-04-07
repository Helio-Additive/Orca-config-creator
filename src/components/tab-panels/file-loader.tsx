import { State, useHookstate } from "@hookstate/core";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { VendorJsonSchema } from "../../lib/bindings/VendorJsonSchema";
import { globalState } from "../../lib/state-store";
import FieldButton from "./field-button";
import InputComponent from "./input-component";
import { ConfigNameAndPath } from "../../lib/bindings/ConfigNameAndPath";
import { MinPrinterModelJsonSchema } from "../../lib/bindings/MinPrinterModelJsonSchema";

export default function FileLoader() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    vendorConfigs,
    modelConfigs,
    installedPrinterConfigs,
  } = useHookstate(globalState);

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
              path: orcaInstallationPath.get() + "/resources/profiles/" + key,
              configNameAndPaths: machine_model_list,
            });

            for (let i = 0; i < machine_model_list.length; i++) {
              modelConfigsParsed[i].fileName =
                orcaInstallationPath.get() +
                "/resources/profiles/" +
                key +
                "/" +
                machine_model_list[i].sub_path;
              modelConfigs[machine_model_list[i].name + "_" + key].set(
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
            const printerConfigsParsed: (MinPrinterModelJsonSchema & {
              fileName: string;
            })[] = await invoke("load_all_printer_presets", {
              path: orcaInstallationPath.get() + "/resources/profiles/" + key,
              configNameAndPaths: machine_list,
            });

            for (let i = 0; i < machine_list.length; i++) {
              printerConfigsParsed[i].fileName =
                orcaInstallationPath.get() +
                "/resources/profiles/" +
                key +
                "/" +
                machine_list[i].sub_path;

              installedPrinterConfigs[key].merge({
                [machine_list[i].name]: printerConfigsParsed[i],
              });
            }
          });
        } else {
          console.log("error");
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
