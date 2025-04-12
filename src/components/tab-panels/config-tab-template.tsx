import { ReactNode } from "react";

export default function ConfigTabTemplate({
  installedConfigs,
  loadedSystemConfigs,
  loadedUserConfigs,
}: {
  installedConfigs: ReactNode[];
  loadedSystemConfigs: ReactNode[];
  loadedUserConfigs: ReactNode[];
}) {
  return (
    <div className="flex min-h-0 h-full">
      <div className="flex flex-col min-h-0 w-[50%] h-full">
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
        <div className="flex flex-col flex-1/2 align-middle justify-center mb-1 overflow-y-auto">
          {loadedSystemConfigs}
        </div>
        <div className="w-[50%] h-2 rounded-full bg-text-secondary my-1" />
        <div className="font-semibold text-text-secondary text-2xl mb-3 pl-3">
          User
        </div>
        <div className="flex flex-col flex-1/2 overflow-y-auto">
          {loadedUserConfigs}
        </div>
      </div>
    </div>
  );
}
