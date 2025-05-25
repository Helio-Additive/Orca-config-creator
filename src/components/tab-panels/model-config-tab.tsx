import { useHookstate } from "@hookstate/core";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { useEffect, useRef } from "react";

export default function ModelConfigTab() {
  const { installedModelConfigs: modelConfigs } = useHookstate(globalState);

  const {
    itemVisibilityState: { model: itemVisibility },
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

  return (
    <div className="h-full overflow-y-auto">
      {modelConfigs.keys.map((vendor, familyIndex) => {
        if (familyIndex === 0) currentIndexes.current.installed = 0;

        const vendorConfig = modelConfigs[vendor];

        return (
          <div key={vendor}>
            <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
              {vendor}
            </span>

            {vendorConfig.keys.map((modelName) => {
              const config = vendorConfig.nested(modelName).get();

              if (
                currentIndexes.current.installed >
                itemVisibility.installed.get()
              )
                return <></>;

              currentIndexes.current.installed += 1;

              if (config.Ok) {
                return (
                  <ConfigItem
                    key={vendor}
                    name={config.Ok.name}
                    text1={vendor}
                    text2={config.Ok.nozzle_diameter.split(";")}
                    fileName={config.fileName}
                    type="printer-model"
                    configLocation="installed"
                    family={vendor}
                    allowEdit
                    index={currentIndexes.current.installed}
                    itemVisibilityNumberState={itemVisibility.installed}
                  />
                );
              } else {
                return (
                  <ConfigItem
                    key={vendor}
                    name={vendor}
                    text2={[config.Err!]}
                    className="bg-transparent-error"
                    fileName={config.fileName}
                    type="printer-model"
                    family={vendor}
                    configLocation="installed"
                    index={currentIndexes.current.installed}
                    itemVisibilityNumberState={itemVisibility.installed}
                  />
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
}
