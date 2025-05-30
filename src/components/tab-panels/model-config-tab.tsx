import { useHookstate } from "@hookstate/core";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { useEffect, useRef } from "react";
import { duplicateFile, matchesQuery, newFile } from "../../lib/commons";
import TopButton from "./config-list/config-item-components/top-button";
import { VscNewFile } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { InputPopover } from "./input-components/input-popover";
import InputComponent from "./input-component";

export default function ModelConfigTab() {
  const { installedModelConfigs: modelConfigs, installedVendorConfigs } =
    useHookstate(globalState);

  const navigate = useNavigate();

  const {
    itemVisibilityState: { model: itemVisibility },
    searchQuery,
    duplicationPopover,
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
            <InputPopover
              popoverVisible={duplicationPopover.visible.get()}
              setPopOverVisible={duplicationPopover.visible.set}
              label="Please select the vendor to copy to"
              description="This will appear in your setup wizard"
              inputChildren={[
                <InputComponent
                  type="combobox"
                  value={duplicationPopover.arguments.newFamily.get()}
                  possibleValues={installedVendorConfigs.keys as string[]}
                  className="mt-4 w-full rounded px-3 py-2"
                  onChange={(e) =>
                    duplicationPopover.arguments.newFamily.set(e as string)
                  }
                  allowEdit
                />,
              ]}
              onSubmit={() => {
                const {
                  type,
                  location,
                  originalName,
                  originalFamily,
                  newFamily,
                } = duplicationPopover.arguments.get();
                duplicateFile(
                  type,
                  location,
                  navigate,
                  originalName,
                  newFamily,
                  originalFamily
                );
              }}
            />
            <div className="flex min-h-0 h-fit mt-3 mb-1 pl-3 items-center">
              <span className="font-semibold text-text-primary text-xl">
                {vendor}
              </span>

              <TopButton
                onClick={() =>
                  newFile("printer-model", "installed", navigate, vendor)
                }
                Icon={VscNewFile}
                tooltip="Add new Config"
                className="text-text-primary ml-2"
              />
            </div>
            {vendorConfig.keys.map((modelName) => {
              const config = vendorConfig.nested(modelName).get();

              if (
                currentIndexes.current.installed >
                  itemVisibility.installed.get() ||
                !matchesQuery(searchQuery.get(), [modelName, vendor])
              )
                return <div key={vendor + modelName}></div>;

              currentIndexes.current.installed += 1;

              if (config.Ok) {
                return (
                  <ConfigItem
                    key={vendor + modelName}
                    name={config.Ok.name}
                    text1={vendor}
                    text2={config.Ok.nozzle_diameter.split(";")}
                    fileName={config.fileName}
                    type="printer-model"
                    configLocation="installed"
                    family={vendor}
                    allowEdit
                    allowDelete
                    allowDuplication
                    index={currentIndexes.current.installed}
                    itemVisibilityNumberState={itemVisibility.installed}
                  />
                );
              } else {
                return (
                  <ConfigItem
                    key={vendor + modelName}
                    name={modelName}
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
