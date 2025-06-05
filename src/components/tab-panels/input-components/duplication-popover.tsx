import { useHookstate } from "@hookstate/core";
import { InputPopover } from "./input-popover";
import { appState, globalState } from "../../../lib/state-store";
import InputComponent from "../input-component";
import { duplicateFile } from "../../../lib/commons";
import { useNavigate } from "react-router-dom";

export default function DuplicationPopover() {
  const navigate = useNavigate();
  const { duplicationPopover } = useHookstate(appState);
  const { installedVendorConfigs } = useHookstate(globalState);

  return (
    <InputPopover
      popoverVisible={duplicationPopover.visible.get()}
      setPopOverVisible={duplicationPopover.visible.set}
      label="Please select the vendor to copy to"
      description="This will appear in your setup wizard"
      inputChildren={[
        <InputComponent
          key={0}
          type="combobox"
          value={duplicationPopover.arguments.newFamily.get()}
          possibleValues={installedVendorConfigs.keys as string[]}
          className="mt-4 w-full rounded px-3 py-2"
          onChange={(e) =>
            duplicationPopover.arguments.newFamily.set(e as string)
          }
          allowEdit
        />,
      ]}
      onSubmit={() => {
        const { type, location, originalName, originalFamily, newFamily } =
          duplicationPopover.arguments.get();
        duplicateFile(
          type,
          location,
          navigate,
          originalName,
          newFamily,
          originalFamily
        );
      }}
    />
  );
}
