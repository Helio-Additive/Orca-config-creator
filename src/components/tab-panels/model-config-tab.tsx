import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function ModelConfigTab() {
  const { installedModelConfigs: modelConfigs } = useHookstate(globalState);

  return (
    <div className="h-full overflow-y-auto">
      {modelConfigs.keys.map((vendor) => {
        const vendorConfig = modelConfigs[vendor];

        return (
          <div key={vendor}>
            <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
              {vendor}
            </span>

            {vendorConfig.keys.map((modelName) => {
              const config = vendorConfig.nested(modelName).get();

              if (config.Ok) {
                return (
                  <ConfigItem
                    key={vendor}
                    name={config.Ok.name}
                    text2={config.Ok.nozzle_diameter.split(";")}
                    fileName={config.fileName}
                    type="printer-model"
                    configLocation="installed"
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
                    configLocation="installed"
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
