import { useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import {
  flattenConfig,
  getFilamentLibraryFilaments,
  matchesQuery,
  newFile,
  refreshConfigs,
} from "../../lib/commons";
import { appState, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { InputPopover } from "./input-components/input-popover";
import TopButton from "./config-list/config-item-components/top-button";
import { VscNewFile } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";

export default function VendorConfigTab() {
  const {
    installedVendorConfigs: vendorConfigs,
    installedPrinterConfigs,
    installedProcessConfigs,
    installedFilamentConfigs,
  } = useHookstate(globalState);

  const { searchQuery } = useHookstate(appState);

  const navigate = useNavigate();

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
      <InputPopover
        popoverVisible={popoverVisible}
        setPopOverVisible={setPopOverVisible}
        label="Enter the new vendor name"
        description="This will appear in your setup wizard"
        inputChildren={[
          <input
            type="text"
            placeholder="Type here..."
            className="mt-4 w-full border border-gray-300 rounded px-3 py-2"
            onChange={(e) => setNewVendorName(e.target.value)}
          />,
        ]}
        onSubmit={() =>
          invoke("duplicate_vendor", {
            path: originalVendorFileName,
            newDirName: newVendorName,
            orcaFilamentLibraryFilaments: getFilamentLibraryFilaments(),
          })
            .then(() => {
              toast("Vendor successfully copied", { type: "success" });
              refreshConfigs("vendor", "installed");
            })
            .catch((err: any) => {
              toast(err.toString(), { type: "error" });
            })
        }
      />

      <TopButton
        onClick={() => newFile("vendor", "installed", navigate)}
        Icon={VscNewFile}
        tooltip="Add new Config"
        className="text-text-primary ml-2"
      />

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

        const onClickDuplicationItem = async () => {
          setOriginalVendorFileName(config.fileName);
          setPopOverVisible(true);
        };

        const duplicationMenuItem = {
          icon: HiOutlineDocumentDuplicate,
          onClick: onClickDuplicationItem,
          text: "Duplicate vendor config",
        };

        if (!matchesQuery(searchQuery.get(), [config.name]))
          return <div key={config.name}></div>;

        return (
          <ConfigItem
            key={key}
            name={key}
            text1={config.version!}
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
