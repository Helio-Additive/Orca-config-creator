import { useHookstate } from "@hookstate/core";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { invoke } from "@tauri-apps/api/tauri";
import { PrinterVariantJsonSchema } from "../../lib/bindings/PrinterVariantJsonSchema";
import { v4 as uuidv4 } from "uuid";
import { basename, dirname } from "@tauri-apps/api/path";
import { toast } from "react-toastify";
import ConfigTabTemplate from "./config-tab-template";

export default function FilamentConfigTab() {
  const {
    installedFilamentConfigs,
    loadedSystemFilamentConfigs,
    loadedUserFilamentConfigs,
    instantiatedInstalledFilamentConfigs,
    modelConfigs,
  } = useHookstate(globalState);

  const load_all_printer_props: any = async (
    configName: string,
    family?: string
  ) => {
    let configFile: string | undefined = undefined;
    const loadedUserPrinterConfigRes = loadedUserPrinterConfigs
      .nested(configName)
      .get({
        stealth: true,
      });

    if (loadedUserPrinterConfigRes) {
      configFile = loadedUserPrinterConfigRes.fileName;
    } else if (!family) {
      const instantiatedInstalledPrinterConfigRes =
        instantiatedInstalledPrinterConfigs.nested(configName).get({
          stealth: true,
        });
      configFile = instantiatedInstalledPrinterConfigRes.fileName;
    } else {
      const possibleConfigRes = loadedSystemPrinterConfigs
        .nested(family)
        .nested(configName)
        .get({ stealth: true });
      configFile = possibleConfigRes.fileName;
    }

    try {
      const res: PrinterVariantJsonSchema = await invoke(
        "load_printer_variant_preset",
        {
          path: configFile,
        }
      );

      if (res.inherits) {
        let printerFamily = family;
        if (res.printer_model) {
          const modelFile = modelConfigs
            .nested(res.printer_model)
            .get({ stealth: true }).fileName;

          const machineDirectory = await dirname(modelFile);
          const familyDirectory = await dirname(machineDirectory);
          printerFamily = await basename(familyDirectory);
        }

        const inherited_props = await load_all_printer_props(
          res.inherits,
          printerFamily
        );
        return {
          ...inherited_props,
          ...Object.fromEntries(
            Object.entries(res).filter(([_, v]) => v != null)
          ),
        };
      } else {
        return res;
      }
    } catch (error: any) {
      console.log("Something went wrong: " + error);
      throw "Could complete inheritance hierarchy: " + error;
    }
  };

  const export_flattened = async (configName: string) => {
    try {
      const res = await load_all_printer_props(configName);
      res.name = res.name + "_" + uuidv4();

      await invoke("save_and_zip_json", { data: res });

      toast("Saved 'Printer presets.zip'", { type: "success" });
    } catch (error: any) {
      toast(error, { type: "error" });
    }
  };

  const installedConfigs = installedFilamentConfigs.keys.map((key) => {
    const vendorConfig = installedFilamentConfigs[key];

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
  });

  const loadedSystemConfigs = loadedSystemFilamentConfigs.keys.map((key) => {
    const vendorConfig = loadedSystemFilamentConfigs[key];

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
  });

  const loadedUserConfigs = loadedUserFilamentConfigs.keys.map((key) => {
    const machineConfig = loadedUserFilamentConfigs.nested(key).get();

    return (
      <ConfigItem
        key={machineConfig.name}
        name={machineConfig.name}
        text2={[
          machineConfig.inherits && machineConfig.inherits.length > 0
            ? machineConfig.inherits
            : "base",
        ]}
        onClick={() => export_flattened(machineConfig.name)}
      />
    );
  });

  return (
    <ConfigTabTemplate
      installedConfigs={installedConfigs}
      loadedSystemConfigs={loadedSystemConfigs}
      loadedUserConfigs={loadedUserConfigs}
    />
  );
}
