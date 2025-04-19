import { useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { BsFiletypeJson } from "react-icons/bs";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import { globalState } from "../../../lib/state-store";
import { ConfigType } from "../../../lib/commons";

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
}) {
  const { editWindowState } = useHookstate(globalState);

  const folderOpener = (path: string) => {
    invoke("check_file", { path }).then((exists) => {
      if (exists) {
        invoke("show_in_folder", { path });
      } else {
        toast(`${path} does not exist`, { type: "error" });
      }
    });
  };

  const navigate = useNavigate();

  const editConfig = () => {
    const encodedFileName = encodeURIComponent(fileName!);

    if (!editWindowState[fileName!].get({ stealth: true }))
      editWindowState[fileName!].set({
        fileName: fileName!,
        type: type,
        name: name,
        family: family!,
        properties: { res: {}, keyDetails: {} },
        changedProps: {},
      });

    navigate(`/edit?fileName=${encodedFileName}`);
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
            <FaEdit
              className="hover:text-text-secondary hover:scale-95 w-6 h-6 mr-1"
              onClick={editConfig}
            />
          )}
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
