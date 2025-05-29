import { useHookstate } from "@hookstate/core";
import {
  ConfigLocationType,
  exportFlattened,
  matchesQuery,
  newFile,
} from "../../lib/commons";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import ConfigTabTemplate from "./config-tab-template";
import { useEffect, useRef } from "react";
import TopButton from "./config-list/config-item-components/top-button";
import { VscNewFile } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";

export default function ProcessConfigTab() {
  const {
    installedProcessConfigs,
    loadedSystemProcessConfigs,
    loadedUserProcessConfigs,
  } = useHookstate(globalState);

  const {
    itemVisibilityState: { process: itemVisibility },
    searchQuery,
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

  const navigate = useNavigate();

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
          <div className="flex min-h-0 h-fit mt-3 mb-1 pl-3 items-center">
            <span className="font-semibold text-text-primary text-xl">
              {key}
            </span>

            <TopButton
              onClick={() => newFile("process", "installed", navigate, key)}
              Icon={VscNewFile}
              tooltip="Add new Config"
              className="text-text-primary ml-2"
            />
          </div>
          {vendorConfig.keys.map((printerName) => {
            const config = vendorConfig.nested(printerName).get();

            if (
              currentIndexes.current.installed >
                itemVisibility.installed.get() ||
              !matchesQuery(searchQuery.get(), [key, printerName])
            )
              return <div key={key + printerName}></div>;

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
                  allowDuplication
                  allowDelete
                  family={key}
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
                  family={key}
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
                itemVisibility.loadedSystem.get() ||
              !matchesQuery(searchQuery.get(), [key, printerName])
            )
              return <div key={key + printerName}></div>;

            currentIndexes.current.loadedSystem += 1;

            if (config.Ok) {
              return (
                <ConfigItem
                  key={key + printerName}
                  name={config.Ok.name}
                  text2={[config.Ok.inherits ?? "base"]}
                  fileName={config.fileName}
                  type="process"
                  family={key}
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
                  family={key}
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
    if (index === 0) currentIndexes.current.user = 0;

    const machineConfig = loadedUserProcessConfigs.nested(key).get();

    if (
      currentIndexes.current.user > itemVisibility.user.get() ||
      !matchesQuery(searchQuery.get(), [machineConfig.name])
    )
      return <div key={machineConfig.name}></div>;

    currentIndexes.current.user += 1;

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
        index={currentIndexes.current.user}
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
