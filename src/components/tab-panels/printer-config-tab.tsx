import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function PrinterConfigTab() {
  const { installedPrinterConfigs } = useHookstate(globalState);

  return (
    <div className="flex min-h-0 h-full">
      <div className="flex flex-col min-h-0 w-[50%] h-full">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Installation Directory
        </div>
        <div className="h-full overflow-y-auto">
          {installedPrinterConfigs.keys.map((key) => {
            const vendorConfig = installedPrinterConfigs[key];

            return (
              <div>
                <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
                  {key}
                </span>
                {vendorConfig.keys.map((printerName) => {
                  const config = vendorConfig[printerName].get();

                  if (config.Ok) {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={config.Ok.name}
                        text2={[config.Ok.inherits!]}
                      />
                    );
                  } else {
                    return (
                      <ConfigItem
                        key={key + printerName}
                        name={printerName}
                        text2={[config.Err!]}
                        className="bg-transparent-error"
                      />
                    );
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[50%] h-full">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Data Directory
        </div>
        <div className="h-full overflow-y-auto"></div>
      </div>
    </div>
  );
}
