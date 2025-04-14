import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function ModelConfigTab() {
  const { modelConfigs } = useHookstate(globalState);

  return (
    <div className="h-full overflow-y-auto">
      {modelConfigs.keys.map((key) => {
        const config = modelConfigs[key].get();

        if (config.Ok) {
          return (
            <ConfigItem
              key={key}
              name={config.Ok.name}
              text2={config.Ok.nozzle_diameter.split(";")}
              fileName={config.fileName}
            />
          );
        } else {
          return (
            <ConfigItem
              key={key}
              name={key}
              text2={[config.Err!]}
              className="bg-transparent-error"
              fileName={config.fileName}
            />
          );
        }
      })}
    </div>
  );
}
