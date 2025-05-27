import { useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import {
  flattenConfig,
  getFilamentLibraryFilaments,
  matchesQuery,
  refreshConfigs,
} from "../../lib/commons";
import { appState, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { twMerge } from "tailwind-merge";

export default function VendorConfigTab() {
  const {
    installedVendorConfigs: vendorConfigs,
    installedPrinterConfigs,
    installedProcessConfigs,
    installedFilamentConfigs,
  } = useHookstate(globalState);

  const { searchQuery } = useHookstate(appState);

  const [popoverVisible, setPopOverVisible] = useState(false);
  const [originalVendorFileName, setOriginalVendorFileName] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  const flatExportFunction = async (vendorName: string) => {
    try {
      const folderName = await invoke("pick_folder", {});
      const uuid = uuidv4();

      const printerConfigs = installedPrinterConfigs[vendorName].keys.map(
        (el) => installedPrinterConfigs[vendorName][el].get({ stealth: true })
      );

      const filamentConfigs = installedFilamentConfigs[vendorName].keys.map(
        (el) => installedFilamentConfigs[vendorName][el].get({ stealth: true })
      );

      const processConfigs = installedProcessConfigs[vendorName].keys.map(
        (el) => installedProcessConfigs[vendorName][el].get({ stealth: true })
      );

      const flattenedPrinterConfigs = (
        await Promise.all(
          printerConfigs.map((el) => {
            if (el.Err) return null;
            else
              return flattenConfig(
                el.Ok!.name,
                "printer",
                "installed",
                vendorName
              );
          })
        )
      ).filter((el) => el !== null);

      const flattenedFilamentConfigs = (
        await Promise.all(
          filamentConfigs.map((el) => {
            if (el.Err) return null;
            else
              return flattenConfig(
                el.Ok!.name,
                "filament",
                "installed",
                vendorName
              );
          })
        )
      ).filter((el) => el !== null);

      const flattenedProcessConfigs = (
        await Promise.all(
          processConfigs.map((el) => {
            if (el.Err) return null;
            else
              return flattenConfig(
                el.Ok!.name,
                "process",
                "installed",
                vendorName
              );
          })
        )
      ).filter((el) => el !== null);

      invoke("save_and_zip_json_bundle", {
        data: flattenedPrinterConfigs.map((el) => el!.data),
        fileNames: flattenedPrinterConfigs.map((el) => el!.fileName),
        folder: folderName,
        zipName: `Printer preset_${uuid}.zip`,
      });

      invoke("save_and_zip_json_bundle", {
        data: flattenedFilamentConfigs.map((el) => el!.data),
        fileNames: flattenedFilamentConfigs.map((el) => el!.fileName),
        folder: folderName,
        zipName: `Filament presets_${uuid}.zip`,
      });

      invoke("save_and_zip_json_bundle", {
        data: flattenedProcessConfigs.map((el) => el!.data),
        fileNames: flattenedProcessConfigs.map((el) => el!.fileName),
        folder: folderName,
        zipName: `Process presets_${uuid}.zip`,
      });

      toast("Vendor config bundles successfully exported", { type: "success" });
    } catch (error: any) {
      toast(error.toString(), { type: "error" });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <Dialog.Root open={popoverVisible} onOpenChange={setPopOverVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className={twMerge(
              "fixed top-1/2 left-1/2 max-w-md w-full -translate-x-1/2 -translate-y-1/2 bg-transparent-white-input rounded-xl p-2 pl-3 pr-4 text-text-primary",
              "shadow-md shadow-transparent-black-hover backdrop-blur-lg",
              "outline-2 -outline-offset-2 outline-text-secondary/20"
            )}
          >
            <Dialog.Title className="text-lg font-medium">
              Enter the new vendor name
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              This will appear in your setup wizard
            </Dialog.Description>

            <input
              type="text"
              placeholder="Type here..."
              className="mt-4 w-full border border-gray-300 rounded px-3 py-2"
              onChange={(e) => setNewVendorName(e.target.value)}
            />

            <div className="mt-6 flex justify-end space-x-2">
              <Dialog.Close asChild>
                <button
                  className="px-4 py-2 rounded bg-transparent-base hover:bg-transparent-black-hover"
                  onClick={() => setPopOverVisible(false)}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="px-4 py-2 rounded bg-accent text-white hover:bg-transparent-black-hover"
                onClick={async () => {
                  setPopOverVisible(false);
                  try {
                    await invoke("duplicate_vendor", {
                      path: originalVendorFileName,
                      newDirName: newVendorName,
                      orcaFilamentLibraryFilaments:
                        getFilamentLibraryFilaments(),
                    });
                    toast("Vendor successfully copied", { type: "success" });
                    refreshConfigs("vendor", "installed");
                  } catch (err: any) {
                    toast(err.toString(), { type: "error" });
                  }
                }}
              >
                Submit
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {vendorConfigs.keys.map((key) => {
        const config = vendorConfigs[key].get();
        const model_num = config.machine_model_list
          ? config.machine_model_list.length
          : 0;
        const machine_num = config.machine_list
          ? config.machine_list.length
          : 0;
        const filament_num = config.filament_list
          ? config.filament_list.length
          : 0;
        const process_num = config.process_list
          ? config.process_list.length
          : 0;

        const onClick = async () => {
          setOriginalVendorFileName(config.fileName);
          setPopOverVisible(true);
        };

        const duplicationMenuItem = {
          icon: HiOutlineDocumentDuplicate,
          onClick: onClick,
          text: "Duplicate vendor config",
        };

        if (!matchesQuery(searchQuery.get(), [config.name]))
          return <div key={config.name}></div>;

        return (
          <ConfigItem
            key={config.name}
            name={config.name}
            text1={config.version}
            text2={[
              `models: ${model_num}`,
              `machines: ${machine_num}`,
              `filaments: ${filament_num}`,
              `processes: ${process_num}`,
            ]}
            fileName={config.fileName}
            type="vendor"
            configLocation="installed"
            allowEdit
            flatExportFunction={flatExportFunction}
            extraOptionsMenuItems={[duplicationMenuItem]}
            onClick={() =>
              invoke("analyse_vendor_config", {
                path: config.fileName,
                configLocation: "installed",
                name: config.name,
              }).then(console.log)
            }
          />
        );
      })}
    </div>
  );
}
