import { useHookstate } from "@hookstate/core";
import { VscNewFile } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import {
  ConfigLocationType,
  exportFlattened,
  newFile,
} from "../../lib/commons";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import TopButton from "./config-list/config-item-components/top-button";
import ConfigTabTemplate from "./config-tab-template";

export default function PrinterConfigTab() {
  const {
    installedPrinterConfigs,
    loadedSystemPrinterConfigs,
    loadedUserPrinterConfigs,
  } = useHookstate(globalState);

  const navigate = useNavigate();

  const export_flattened = async (
    configName: string,
    location: ConfigLocationType,
    family?: string
  ) => exportFlattened(configName, "printer", location, family);

  const installedConfigs = installedPrinterConfigs.keys.map((key) => {
    const vendorConfig = installedPrinterConfigs[key];

    return (
      <div key={key}>
        <div className="flex min-h-0 h-fit mt-3 mb-1 pl-3 items-center">
          <span className="font-semibold text-text-primary text-xl">{key}</span>

          <TopButton
            onClick={() => newFile("printer", "installed", navigate, key)}
            Icon={VscNewFile}
            tooltip="Add new Config"
            className="text-text-primary ml-2"
          />
        </div>
        {vendorConfig.keys.map((printerName) => {
          const config = vendorConfig.nested(printerName).get();

          if (config.Ok) {
            return (
              <ConfigItem
                key={key + printerName}
                name={config.Ok.name}
                text2={[config.Ok.inherits ?? "base"]}
                fileName={config.fileName}
                type="printer"
                family={key}
                allowEdit
                configLocation="installed"
                flatExportFunction={export_flattened}
                allowDelete
              />
            );
          } else {
            return (
              <ConfigItem
                key={key + printerName}
                name={printerName}
                text2={[config.Err!]}
                className="bg-transparent-error"
                fileName={config.fileName}
                type="printer"
                configLocation="installed"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedSystemConfigs = loadedSystemPrinterConfigs.keys.map((key) => {
    const vendorConfig = loadedSystemPrinterConfigs[key];

    return (
      <div key={key}>
        <span className="font-semibold text-text-primary text-xl mb-1 pl-3 mt-3">
          {key}
        </span>
        {vendorConfig.keys.map((printerName) => {
          const config = vendorConfig.nested(printerName).get();

          if (config.Ok) {
            return (
              <ConfigItem
                key={key + printerName}
                name={config.Ok.name}
                text2={[config.Ok.inherits ?? "base"]}
                fileName={config.fileName}
                type="printer"
                family={key}
                configLocation="loaded_system"
              />
            );
          } else {
            return (
              <ConfigItem
                key={key + printerName}
                name={printerName}
                text2={[config.Err!]}
                className="bg-transparent-error"
                fileName={config.fileName}
                type="printer"
                configLocation="loaded_system"
              />
            );
          }
        })}
      </div>
    );
  });

  const loadedUserConfigs = loadedUserPrinterConfigs.keys.map((key) => {
    const machineConfig = loadedUserPrinterConfigs.nested(key).get();

    return (
      <ConfigItem
        key={machineConfig.name}
        name={machineConfig.name}
        text2={[
          machineConfig.inherits && machineConfig.inherits.length > 0
            ? machineConfig.inherits
            : "base",
        ]}
        flatExportFunction={export_flattened}
        fileName={machineConfig.fileName}
        allowEdit
        type="printer"
        configLocation="user"
        allowDelete
      />
    );
  });

  return (
    <ConfigTabTemplate
      installedConfigs={installedConfigs}
      loadedSystemConfigs={loadedSystemConfigs}
      loadedUserConfigs={loadedUserConfigs}
      type="printer"
    />
  );
}
