import { twMerge } from "tailwind-merge";
import { BsFiletypeJson } from "react-icons/bs";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";

export default function ConfigItem({
  name,
  text1,
  text2,
  className,
  onClick,
  fileName,
}: {
  name: string;
  text1?: string;
  text2?: string[];
  className?: string;
  onClick?: () => void;
  fileName?: string;
}) {
  const folderOpener = (path: string) => {
    invoke("check_file", { path }).then((exists) => {
      if (exists) {
        invoke("show_in_folder", { path });
      } else {
        toast(`${path} does not exist`, { type: "error" });
      }
    });
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
      <div className="flex mb-2 relative">
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
        <div className="absolute right-0 mr-1 text-text-primary">
          {fileName && (
            <BsFiletypeJson
              className="hover:text-text-secondary hover:scale-95 w-6 h-6"
              onClick={() => {
                folderOpener(fileName);
              }}
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
