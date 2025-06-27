import { ReactNode, useEffect, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import { FaEdit, FaFileExport } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import {
  ConfigLocationType,
  ConfigType,
  deleteConfig,
  editConfigFile,
  folderOpener,
} from "../../../lib/commons";
import OptionsMenu from "./config-item-components/options-menu";
import TopButton from "./config-item-components/top-button";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useIntersectionObserver } from "usehooks-ts";
import { State, useHookstate } from "@hookstate/core";
import { appState } from "../../../lib/state-store";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";
import {
  checkConfigInSelectedSet,
  selectConfigToggle,
} from "../../../lib/edit-config-helpers";

type OptionMenuItem = {
  icon: (a: { className?: string }) => ReactNode;
  text: string;
  onClick: () => void;
};

export default function ConfigItem({
  name,
  family,
  type,
  text1,
  text2,
  className,
  onClick,
  fileName,
  allowEdit = false,
  flatExportFunction,
  configLocation,
  allowDelete,
  allowDuplication,
  extraOptionsMenuItems = [],
  index,
  itemVisibilityNumberState,
  allowSelection,
}: {
  name: string;
  family?: string;
  type: ConfigType;
  text1?: string;
  text2?: string[];
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  fileName?: string;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowDuplication?: boolean;
  flatExportFunction?: (
    configName: string,
    location: ConfigLocationType,
    family?: string
  ) => void;
  configLocation: ConfigLocationType;
  extraOptionsMenuItems?: OptionMenuItem[];
  index?: number;
  itemVisibilityNumberState?: State<number, {}>;
  allowSelection?: boolean;
}) {
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });

  useEffect(() => {
    if (
      isIntersecting &&
      itemVisibilityNumberState &&
      index &&
      index > itemVisibilityNumberState.get({ stealth: true }) - 5
    ) {
      itemVisibilityNumberState.set((v) => v + 15);
    }
  }, [isIntersecting]);

  const navigate = useNavigate();

  const editConfig = () => {
    editConfigFile(name, type, fileName!, configLocation, navigate, family);
  };

  const {
    duplicationPopover,
    selectedConfigs,
    selectedConfigType,
    propertyCopyPopover,
  } = useHookstate(appState);

  const [isSelected, setIsSelected] = useState(
    checkConfigInSelectedSet(name, type, configLocation, family)
  );

  useEffect(() => {
    console.log("selected");
    setIsSelected(checkConfigInSelectedSet(name, type, configLocation, family));
  }, [selectedConfigs]);

  const optionsMenuItems: OptionMenuItem[] = [];

  flatExportFunction &&
    optionsMenuItems.push({
      icon: FaFileExport,
      onClick: () => {
        flatExportFunction(name, configLocation, family);
      },
      text: "Export flattened",
    });

  allowDelete &&
    optionsMenuItems.push({
      icon: RiDeleteBin6Line,
      onClick: () => {
        deleteConfig(name, type, configLocation, family);
      },
      text: "Delete config",
    });

  if (allowDuplication) {
    const onClickDuplicationItem = async () => {
      duplicationPopover.arguments.set({
        type,
        location: configLocation,
        originalName: name,
        originalFamily: family,
        newFamily: family,
      });

      if (configLocation !== "user") duplicationPopover.visible.set(true);
    };

    const duplicationMenuItem = {
      icon: HiOutlineDocumentDuplicate,
      onClick: onClickDuplicationItem,
      text: "Duplicate config",
    };

    optionsMenuItems.push(duplicationMenuItem);
  }

  if (
    allowSelection &&
    selectedConfigs.get().size > 0 &&
    selectedConfigType.get() === type &&
    !isSelected
  ) {
    const onClickDuplicationItem = async () => {
      propertyCopyPopover.arguments.set({
        type,
        location: configLocation,
        name: name,
        family: family,
      });

      propertyCopyPopover.propToCopy.set(undefined);
      propertyCopyPopover.visible.set(true);
    };

    const propCopyMenuItem = {
      icon: HiOutlineDocumentDuplicate,
      onClick: onClickDuplicationItem,
      text: "Copy property",
    };

    optionsMenuItems.push(propCopyMenuItem);
  }

  extraOptionsMenuItems.forEach((el) => optionsMenuItems.push(el));

  return (
    <div
      className={twMerge(
        "bg-transparent-white-input rounded-xl p-2 pl-4 max-w-[36rem] mb-2",
        "shadow-md shadow-transparent-black-hover",
        "hover:bg-transparent-black-hover",
        className
      )}
      onClick={onClick}
      ref={ref}
    >
      <div className="flex mb-2 relative justify-between">
        <div className="flex">
          {allowSelection && (
            <TopButton
              onClick={() =>
                selectConfigToggle(name, type, configLocation, family)
              }
              Icon={isSelected ? MdCheckBox : MdCheckBoxOutlineBlank}
              className="mr-1 text-text-primary"
              tooltip="Select"
            />
          )}
          <span className="text-text-primary text-lg/6 font-medium mr-1 text-wrap">
            {name}
          </span>
          {text1 && (
            <span className="text-text-secondary text-lg/6 font-medium mr-1">
              &middot;
            </span>
          )}
          {text1 && (
            <span className="text-text-secondary text-lg/6 font-medium mr-1">
              {text1}
            </span>
          )}
        </div>
        <div className="flex text-text-primary">
          {allowEdit && fileName && (
            <TopButton
              onClick={editConfig}
              Icon={FaEdit}
              className="mr-1"
              tooltip="Edit config"
            />
          )}
          {fileName && (
            <TopButton
              onClick={() => {
                folderOpener(fileName);
              }}
              Icon={BsFiletypeJson}
              className="mr-1"
              tooltip="Open containing folder"
            />
          )}
          {optionsMenuItems.length > 0 && (
            <OptionsMenu menuItems={optionsMenuItems} />
          )}
        </div>
      </div>

      {text2 && (
        <div className="flex">
          <span className="text-text-secondary text-md font-medium mr-1">
            {text2.join(" · ")}
          </span>
        </div>
      )}
    </div>
  );
}
