import { useHookstate } from "@hookstate/core";
import { ConfigLocationType, exportFlattened } from "../../lib/commons";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import ConfigTabTemplate from "./config-tab-template";
import { useEffect, useRef } from "react";

export default function ProcessConfigTab() {
  const {
    installedProcessConfigs,
    loadedSystemProcessConfigs,
    loadedUserProcessConfigs,
  } = useHookstate(globalState);

  const {
    itemVisibilityState: { process: itemVisibility },
  } = useHookstate(appState);

  const currentIndexes = useRef({ installed: 0, loadedSystem: 0, user: 0 });

  useEffect(() => {
    return () => {
      itemVisibility.installed.set(
        appStateObject.itemVisibilityState.printer.installed
      );
      itemVisibility.loadedSystem.set(
        appStateObject.itemVisibilityState.printer.loadedSystem
      );
      itemVisibility.user.set(appStateObject.itemVisibilityState.printer.user);
    };
  }, []);

  const export_flattened = async (
    configName: string,
    location: ConfigLocationType,
    family?: string
  ) => exportFlattened(configName, "process", location, family);

  const installedConfigs = installedProcessConfigs.keys.map(
    (key, familyIndex) => {
      if (familyIndex === 0) currentIndexes.current.installed = 0;

      const vendorConfig = installedProcessConfigs[key];

      return (
        <div key={key}>
          <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
            {key}
          </span>
          {vendorConfig.keys.map((printerName) => {
            const config = vendorConfig.nested(printerName).get();

            if (
              currentIndexes.current.installed > itemVisibility.installed.get()
            )
              return <></>;

            currentIndexes.current.installed += 1;

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
                  index={currentIndexes.current.installed}
                  itemVisibilityNumberState={itemVisibility.installed}
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
                  index={currentIndexes.current.installed}
                  itemVisibilityNumberState={itemVisibility.installed}
                />
              );
            }
          })}
        </div>
      );
    }
  );

  const loadedSystemConfigs = loadedSystemProcessConfigs.keys.map(
    (key, familyIndex) => {
      if (familyIndex === 0) currentIndexes.current.loadedSystem = 0;

      const vendorConfig = loadedSystemProcessConfigs[key];

      return (
        <div key={key}>
          <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
            {key}
          </span>
          {vendorConfig.keys.map((printerName) => {
            const config = vendorConfig.nested(printerName).get();

            if (
              currentIndexes.current.loadedSystem >
              itemVisibility.loadedSystem.get()
            )
              return <></>;

            currentIndexes.current.loadedSystem += 1;

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
                  index={currentIndexes.current.loadedSystem}
                  itemVisibilityNumberState={itemVisibility.loadedSystem}
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
                  index={currentIndexes.current.loadedSystem}
                  itemVisibilityNumberState={itemVisibility.loadedSystem}
                />
              );
            }
          })}
        </div>
      );
    }
  );

  const loadedUserConfigs = loadedUserProcessConfigs.keys.map((key, index) => {
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
        index={index}
        itemVisibilityNumberState={itemVisibility.user}
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
