import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function PrinterConfigTab() {
  const { printerConfigs } = useHookstate(globalState);

  return (
    <div className="h-full overflow-y-auto">
      {printerConfigs.keys.map((key) => {
        const config = printerConfigs[key].get();

        if (config.Ok) {
          return (
            <ConfigItem
              key={key}
              name={config.Ok.name}
              text1={config.Ok.nozzle_diameter}
              text2={[config.Ok.inherits]}
            />
          );
        } else {
          return (
            <ConfigItem
              key={key}
              name={key}
              text2={[config.Err!]}
              className="bg-transparent-error"
            />
          );
        }
      })}
    </div>
  );
}
