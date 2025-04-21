import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import ConfigTabTemplate from "./config-tab-template";
import { deinherit_and_load_all_props, updateUuid } from "../../lib/commons";

export default function ProcessConfigTab() {
  const {
    installedProcessConfigs,
    loadedSystemProcessConfigs,
    loadedUserProcessConfigs,
    instantiatedInstalledProcessConfigs,
  } = useHookstate(globalState);

  const export_flattened = async (configName: string) => {
    try {
      const configObject = await deinherit_and_load_all_props(
        installedProcessConfigs,
        instantiatedInstalledProcessConfigs,
        loadedSystemProcessConfigs,
        loadedUserProcessConfigs,
        configName
      );

      const res = configObject.res;
      res.name = updateUuid(res.name);
      res["compatible_printers"] = [];
      delete res["inherits"];

      await invoke("save_and_zip_json", {
        data: res,
        fileName: `Process presets_${res.name}.zip`,
      });

      toast(`Saved 'Process presets_${res.name}.zip'`, { type: "success" });
    } catch (error: any) {
      toast(error.toString(), { type: "error" });
    }
  };

  const installedConfigs = installedProcessConfigs.keys.map((key) => {
    const vendorConfig = installedProcessConfigs[key];

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
                type="process"
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
                type="process"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedSystemConfigs = loadedSystemProcessConfigs.keys.map((key) => {
    const vendorConfig = loadedSystemProcessConfigs[key];

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
                type="process"
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
                type="process"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedUserConfigs = loadedUserProcessConfigs.keys.map((key) => {
    const machineConfig = loadedUserProcessConfigs.nested(key).get();

    return (
      <ConfigItem
        key={machineConfig.name}
        name={machineConfig.name}
        text2={[
          machineConfig.inherits && machineConfig.inherits.length > 0
            ? machineConfig.inherits
            : "base",
        ]}
        fileName={machineConfig.fileName}
        type="process"
        flatExportFunction={export_flattened}
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
