import { useHookstate } from "@hookstate/core";
import { ConfigLocationType, exportFlattened } from "../../lib/commons";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import ConfigTabTemplate from "./config-tab-template";

export default function ProcessConfigTab() {
  const {
    installedProcessConfigs,
    loadedSystemProcessConfigs,
    loadedUserProcessConfigs,
  } = useHookstate(globalState);

  const export_flattened = async (
    configName: string,
    location: ConfigLocationType,
    family?: string
  ) => exportFlattened(configName, "process", location, family);

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
                text1={key}
                text2={[config.Ok.inherits ?? "base"]}
                fileName={config.fileName}
                type="process"
                allowEdit
                configLocation="installed"
                flatExportFunction={export_flattened}
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
                configLocation="installed"
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
                configLocation="loaded_system"
                flatExportFunction={export_flattened}
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
                configLocation="loaded_system"
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
        allowEdit
        flatExportFunction={export_flattened}
        configLocation="user"
        allowDelete
      />
    );
  });

  return (
    <ConfigTabTemplate
      installedConfigs={installedConfigs}
      loadedSystemConfigs={loadedSystemConfigs}
      loadedUserConfigs={loadedUserConfigs}
      type="process"
    />
  );
}
