import clsx from "clsx";

export default function ConfigItem({
  name,
  version,
  models,
  machines,
  filaments,
  processes,
}: {
  name: string;
  version: string;
  models: number;
  machines: number;
  filaments: number;
  processes: number;
}) {
  return (
    <div
      className={clsx(
        "bg-transparent-white-input rounded-xl p-2 pl-4 max-w-[36rem] mb-2",
        "shadow-md shadow-transparent-black-hover",
        "hover:bg-transparent-black-hover"
      )}
    >
      <div className="flex mb-2">
        <span className="text-text-primary text-lg/6 font-medium mr-1">
          {name}
        </span>
        <span className="text-text-secondary text-lg/6 font-medium mr-1">
          &middot;
        </span>
        <span className="text-text-secondary text-lg/6 font-medium mr-1">
          {version}
        </span>
      </div>

      <div className="flex">
        <span className="text-text-secondary text-md font-medium mr-1">
          models: {models} &middot; machines: {machines} &middot; filaments:{" "}
          {filaments} &middot; processes: {processes}
        </span>
      </div>
    </div>
  );
}
