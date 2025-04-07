import { twMerge } from "tailwind-merge";

export default function ConfigItem({
  name,
  text1,
  text2,
  className,
  onClick,
}: {
  name: string;
  text1?: string;
  text2?: string[];
  className?: string;
  onClick?: () => void;
}) {
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
      <div className="flex mb-2">
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
