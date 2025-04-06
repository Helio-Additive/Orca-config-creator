import { useHookstate } from "@hookstate/core";
import ConfigItem from "./config-list/config-item";
import { globalState } from "../../lib/state-store";

export default function VendorConfigTab() {
  const { vendorConfigs } = useHookstate(globalState);
  return (
    <div className="w-full h-full max-h-full">
      {vendorConfigs.keys.map((key) => {
        const config = vendorConfigs[key]!;

        return (
          <ConfigItem
            name={config.name.get() as string}
            version={config.version.get() as string}
            machines={config.machine_list.length}
            models={config.machine_model_list.length}
            filaments={config.filament_list.length}
            processes={config.process_list.length}
          />
        );
      })}
    </div>
  );
}
