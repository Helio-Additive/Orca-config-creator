import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function PrinterConfigTab() {
  const {
    installedPrinterConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
  } = useHookstate(globalState);
  console.log(loadedUserPrinterConfigs.get());
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
                        text2={[config.Ok.inherits ?? "base"]}
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

      <div className="w-[50%] h-full flex flex-col min-h-0">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Data Directory
        </div>
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          System
        </div>
        <div className="flex flex-col flex-1/2 align-middle justify-center mb-1 overflow-y-auto">
          {loadedSystemPrinterConfigs.keys.map((key) => {
            const vendorConfig = loadedSystemPrinterConfigs[key];

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
                        text2={[config.Ok.inherits ?? "base"]}
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
        <div className="w-[50%] h-2 rounded-full bg-text-secondary my-1" />
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          User
        </div>
        <div className="flex flex-col flex-1/2 overflow-y-auto">
          {loadedUserPrinterConfigs.keys.map((key) => {
            console.log(loadedUserPrinterConfigs[key].get());
            const machineConfig = loadedUserPrinterConfigs[key].get();

            return (
              <ConfigItem
                key={machineConfig.name}
                name={machineConfig.name}
                text2={[
                  machineConfig.inherits && machineConfig.inherits.length > 0
                    ? machineConfig.inherits
                    : "base",
                ]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
