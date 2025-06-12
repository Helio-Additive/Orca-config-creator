import { ReactNode } from "react";
import { VscNewFile } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { ConfigType, newFile } from "../../lib/commons";
import TopButton from "./config-list/config-item-components/top-button";
import DuplicationPopover from "./input-components/duplication-popover";
import PropertyCopyPopover from "./input-components/property-copy-popover";

export default function ConfigTabTemplate({
  installedConfigs,
  loadedSystemConfigs,
  loadedUserConfigs,
  type,
}: {
  installedConfigs: ReactNode[];
  loadedSystemConfigs: ReactNode[];
  loadedUserConfigs: ReactNode[];
  type: ConfigType;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 h-full">
      <DuplicationPopover />
      <PropertyCopyPopover />
      <div className="flex flex-col min-h-0 w-[50%] h-full mr-2">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Installation Directory
        </div>
        <div className="h-full overflow-y-auto">{installedConfigs}</div>
      </div>
      <div className="w-[50%] h-full flex flex-col min-h-0">
        <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
          Data Directory
        </div>
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          System
        </div>
        <div className="flex flex-col flex-1/2 mb-1 overflow-y-auto">
          {loadedSystemConfigs}
        </div>
        <div className="w-[50%] h-2 rounded-full bg-text-secondary my-1" />
        <div className="flex font-semibold text-text-primary text-2xl mb-3 pl-3 items-center">
          <span className="text-text-secondary">User</span>
          <div>
            <TopButton
              onClick={() => newFile(type, "user", navigate)}
              Icon={VscNewFile}
              tooltip="Add new Config"
              className="ml-2"
            />
          </div>
        </div>
        <div className="flex flex-col flex-1/2 overflow-y-auto">
          {loadedUserConfigs}
        </div>
      </div>
    </div>
  );
}
