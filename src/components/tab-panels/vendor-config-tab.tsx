import { useHookstate } from "@hookstate/core";
import ConfigItem from "./config-list/config-item";
import { globalState } from "../../lib/state-store";

export default function VendorConfigTab() {
  const { vendorConfigs } = useHookstate(globalState);
  return (
    <div className="h-full overflow-y-auto">
      {vendorConfigs.keys.map((key) => {
        const config = vendorConfigs[key].get();
        const model_num = config.machine_model_list.length;
        const machine_num = config.machine_model_list.length;
        const filament_num = config.machine_model_list.length;
        const process_num = config.machine_model_list.length;

        return (
          <ConfigItem
            name={config.name}
            text1={config.version}
            text2={[
              `models: ${model_num}`,
              `machines: ${machine_num}`,
              `filaments: ${filament_num}`,
              `processes: ${process_num}`,
            ]}
          />
        );
      })}
    </div>
  );
}
