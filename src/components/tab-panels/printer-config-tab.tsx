import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import ConfigTabTemplate from "./config-tab-template";
import { deinherit_and_load_all_props, updateUuid } from "../../lib/commons";

export default function PrinterConfigTab() {
  const {
    installedPrinterConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
    instantiatedInstalledPrinterConfigs,
  } = useHookstate(globalState);

  const export_flattened = async (configName: string) => {
    try {
      const configObject = await deinherit_and_load_all_props(
        configName,
        "printer"
      );

      const res = configObject.res;
      res.name = updateUuid(res.name);
      delete res["inherits"];

      await invoke("save_and_zip_json", {
        data: res,
        fileName: `Printer presets_${res.name}.zip`,
      });

      toast(`Saved 'Printer presets_${res.name}.zip'`, { type: "success" });
    } catch (error: any) {
      toast(error.toString(), { type: "error" });
    }
  };

  const installedConfigs = installedPrinterConfigs.keys.map((key) => {
    const vendorConfig = installedPrinterConfigs[key];

    return (
      <div key={key}>
        <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
          {key}
        </span>
        {vendorConfig.keys.map((printerName) => {
          const config = vendorConfig.nested(printerName).get();

          if (config.Ok) {
            return (
              <ConfigItem
                key={key + printerName}
                name={config.Ok.name}
                text2={[config.Ok.inherits ?? "base"]}
                fileName={config.fileName}
                type="printer"
                family={key}
                allowEdit
              />
            );
          } else {
            return (
              <ConfigItem
                key={key + printerName}
                name={printerName}
                text2={[config.Err!]}
                className="bg-transparent-error"
                fileName={config.fileName}
                type="printer"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedSystemConfigs = loadedSystemPrinterConfigs.keys.map((key) => {
    const vendorConfig = loadedSystemPrinterConfigs[key];

    return (
      <div key={key}>
        <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
          {key}
        </span>
        {vendorConfig.keys.map((printerName) => {
          const config = vendorConfig.nested(printerName).get();

          if (config.Ok) {
            return (
              <ConfigItem
                key={key + printerName}
                name={config.Ok.name}
                text2={[config.Ok.inherits ?? "base"]}
                fileName={config.fileName}
                type="printer"
                family={key}
              />
            );
          } else {
            return (
              <ConfigItem
                key={key + printerName}
                name={printerName}
                text2={[config.Err!]}
                className="bg-transparent-error"
                fileName={config.fileName}
                type="printer"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedUserConfigs = loadedUserPrinterConfigs.keys.map((key) => {
    const machineConfig = loadedUserPrinterConfigs.nested(key).get();

    return (
      <ConfigItem
        key={machineConfig.name}
        name={machineConfig.name}
        text2={[
          machineConfig.inherits && machineConfig.inherits.length > 0
            ? machineConfig.inherits
            : "base",
        ]}
        flatExportFunction={export_flattened}
        fileName={machineConfig.fileName}
        allowEdit
        type="printer"
      />
    );
  });

  return (
    <ConfigTabTemplate
      installedConfigs={installedConfigs}
      loadedSystemConfigs={loadedSystemConfigs}
      loadedUserConfigs={loadedUserConfigs}
    />
  );
}
