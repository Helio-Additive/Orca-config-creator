import { useHookstate } from "@hookstate/core";
import ConfigItem from "./config-list/config-item";
import { globalState } from "../../lib/state-store";

export default function VendorConfigTab() {
  const { vendorConfigs } = useHookstate(globalState);
  return (
    <div className="w-full min-h-[3000px]">
      {vendorConfigs.keys.map((key) => {
        const config = vendorConfigs[key].get();

        return (
          <ConfigItem
            name={config.name}
            version={config.version}
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
