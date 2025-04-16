import { useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import { deinherit_and_load_all_props, updateUuid } from "../../lib/commons";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import ConfigTabTemplate from "./config-tab-template";

export default function FilamentConfigTab() {
  const {
    installedFilamentConfigs,
    loadedSystemFilamentConfigs,
    loadedUserFilamentConfigs,
    instantiatedInstalledFilamentConfigs,
  } = useHookstate(globalState);

  const export_flattened = async (configName: string) => {
    try {
      const configObject = await deinherit_and_load_all_props(
        installedFilamentConfigs,
        instantiatedInstalledFilamentConfigs,
        loadedSystemFilamentConfigs,
        loadedUserFilamentConfigs,
        configName
      );

      const res = configObject.res;
      res.name = updateUuid(res.name);
      res["compatible_printers"] = [];
      delete res["inherits"];

      await invoke("save_and_zip_json", {
        data: res,
        fileName: "Filament presets.zip",
      });

      toast("Saved 'Filament presets.zip'", { type: "success" });
    } catch (error: any) {
      toast(error, { type: "error" });
    }
  };

  const installedConfigs = installedFilamentConfigs.keys.map((key) => {
    const vendorConfig = installedFilamentConfigs[key];

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
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedSystemConfigs = loadedSystemFilamentConfigs.keys.map((key) => {
    const vendorConfig = loadedSystemFilamentConfigs[key];

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
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedUserConfigs = loadedUserFilamentConfigs.keys.map((key) => {
    const machineConfig = loadedUserFilamentConfigs.nested(key).get();

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
        fileName={machineConfig.fileName}
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
