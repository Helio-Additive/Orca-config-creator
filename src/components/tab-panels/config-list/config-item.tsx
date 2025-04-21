import { BsFiletypeJson } from "react-icons/bs";
import { FaEdit, FaFileExport } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { ConfigType, editConfigFile, folderOpener } from "../../../lib/commons";
import { ReactNode } from "react";
import { Tooltip } from "radix-ui";
import Infotip from "../../tooltip/infotip";

function TopButton({
  Icon,
  onClick,
  className,
  tooltip,
}: {
  className?: string;
  Icon: (a: { className?: string }) => ReactNode;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <Tooltip.Root delayDuration={800}>
      <Tooltip.Trigger asChild>
        <div
          onClick={onClick}
          className={twMerge(
            "hover:text-text-secondary hover:scale-95 w-6 h-6 active:scale-85",
            className
          )}
        >
          <Icon className="w-full h-full" />
        </div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Content>
          <Infotip tooltip={tooltip} />
        </Tooltip.Content>
      )}
    </Tooltip.Root>
  );
}

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
  flatExportFunction?: (configName: string, family?: string) => void;
}) {
  const navigate = useNavigate();

  const editConfig = () => {
    editConfigFile(name, type, fileName!, navigate, family);
  };

  return (
    <div
      className={twMerge(
        "bg-transparent-white-input rounded-xl p-2 pl-4 max-w-[36rem] mb-2",
        "shadow-md shadow-transparent-black-hover",
        "hover:bg-transparent-black-hover",
        className
      )}
      onClick={onClick}
    >
      <div className="flex mb-2 relative justify-between">
        <div>
          <span className="text-text-primary text-lg/6 font-medium mr-1">
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
          {flatExportFunction && (
            <TopButton
              onClick={() => {
                flatExportFunction(name);
              }}
              Icon={FaFileExport}
              tooltip="Export flattened config"
            />
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
