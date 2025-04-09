import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { invoke } from "@tauri-apps/api/tauri";
import { PrinterVariantJsonSchema } from "../../lib/bindings/PrinterVariantJsonSchema";
import { v4 as uuidv4 } from "uuid";

export default function PrinterConfigTab() {
  const {
    installedPrinterConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
    instantiatedInstalledPrinterConfigs,
    modelConfigs,
  } = useHookstate(globalState);

  const load_all_printer_props: any = async (
    configName: string,
    family?: string
  ) => {
    let configFile: string | undefined = undefined;
    const loadedUserPrinterConfigRes = loadedUserPrinterConfigs[configName].get(
      {
        stealth: true,
      }
    );

    if (loadedUserPrinterConfigRes) {
      configFile = loadedUserPrinterConfigRes.fileName;
    } else if (!family) {
      const instantiatedInstalledPrinterConfigRes =
        instantiatedInstalledPrinterConfigs[configName].get({
          stealth: true,
        });
      configFile = instantiatedInstalledPrinterConfigRes.fileName;
    } else {
      const possibleConfigRes = loadedSystemPrinterConfigs[family][
        configName
      ].get({ stealth: true });
      configFile = possibleConfigRes.fileName;
    }

    try {
      const res: PrinterVariantJsonSchema = await invoke(
        "load_printer_variant_preset",
        {
          path: configFile,
        }
      );

      if (res.inherits) {
        let printerFamily = family;
        if (res.printer_model) {
          printerFamily = modelConfigs[res.printer_model].get({ stealth: true })
            .Ok!.family;
        }
        const inherited_props = await load_all_printer_props(
          res.inherits,
          printerFamily
        );
        return {
          ...inherited_props,
          ...Object.fromEntries(
            Object.entries(res).filter(([_, v]) => v != null)
          ),
        };
      } else {
        return res;
      }
    } catch (error: any) {
      console.log("Something went wrong");
    }
  };

  const export_flattened = async (configName: string) => {
    const res = await load_all_printer_props(configName);
    res.name = res.name + "_" + uuidv4();

    await invoke("save_and_zip_json", { data: res });
    console.log("flattened_config", res);
  };

  return (
    <div className="flex min-h-0 h-full">
      <div className="flex flex-col min-h-0 w-[50%] h-full">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Installation Directory
        </div>
        <div className="h-full overflow-y-auto">
          {installedPrinterConfigs.keys.map((key) => {
            const vendorConfig = installedPrinterConfigs[key];

            return (
              <div key={key}>
                <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
                  {key}
                </span>
                {vendorConfig.keys.map((printerName) => {
                  const config = vendorConfig[printerName].get();

                  if (config.Ok) {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={config.Ok.name}
                        text2={[config.Ok.inherits ?? "base"]}
                      />
                    );
                  } else {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={printerName}
                        text2={[config.Err!]}
                        className="bg-transparent-error"
                      />
                    );
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[50%] h-full flex flex-col min-h-0">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Data Directory
        </div>
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          System
        </div>
        <div className="flex flex-col flex-1/2 align-middle justify-center mb-1 overflow-y-auto">
          {loadedSystemPrinterConfigs.keys.map((key) => {
            const vendorConfig = loadedSystemPrinterConfigs[key];

            return (
              <div key={key}>
                <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
                  {key}
                </span>
                {vendorConfig.keys.map((printerName) => {
                  const config = vendorConfig[printerName].get();

                  if (config.Ok) {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={config.Ok.name}
                        text2={[config.Ok.inherits ?? "base"]}
                      />
                    );
                  } else {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={printerName}
                        text2={[config.Err!]}
                        className="bg-transparent-error"
                      />
                    );
                  }
                })}
              </div>
            );
          })}
        </div>
        <div className="w-[50%] h-2 rounded-full bg-text-secondary my-1" />
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          User
        </div>
        <div className="flex flex-col flex-1/2 overflow-y-auto">
          {loadedUserPrinterConfigs.keys.map((key) => {
            const machineConfig = loadedUserPrinterConfigs[key].get();

            return (
              <ConfigItem
                key={machineConfig.name}
                name={machineConfig.name}
                text2={[
                  machineConfig.inherits && machineConfig.inherits.length > 0
                    ? machineConfig.inherits
                    : "base",
                ]}
                onClick={() => export_flattened(machineConfig.name)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
