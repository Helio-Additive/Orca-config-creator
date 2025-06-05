import { useHookstate } from "@hookstate/core";
import InputComponent from "../input-component";
import { InputPopover } from "./input-popover";
import { appState } from "../../../lib/state-store";
import { useEffect, useState } from "react";
import { deinherit_and_load_all_props } from "../../../lib/commons";
import { getConfigsFromSelectedSet } from "../../../lib/edit-config-helpers";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";

export default function PropertyCopyPopover() {
  const { propertyCopyPopover, selectedConfigs } = useHookstate(appState);

  const [possibleValues, setPossibleValues] = useState([] as string[]);

  useEffect(() => {
    const { name, type, location, family } = propertyCopyPopover.arguments.get({
      stealth: true,
    });
    if (propertyCopyPopover.visible.get({ stealth: true })) {
      deinherit_and_load_all_props(name, type, location, family).then(
        (res: any) => {
          setPossibleValues(Object.keys(res.res));
        }
      );
    }
  }, [propertyCopyPopover.arguments]);

  return (
    <InputPopover
      popoverVisible={propertyCopyPopover.visible.get()}
      setPopOverVisible={propertyCopyPopover.visible.set}
      label="Please select the property to copy to other configs"
      inputChildren={[
        <InputComponent
          key={0}
          type="dropdown"
          value={propertyCopyPopover.propToCopy.get()}
          enumValues={possibleValues.map((a) => [a, a])}
          possibleValues={propertyCopyPopover.keys as string[]}
          className="mt-4 w-full rounded px-3 py-2"
          onChange={(e) => propertyCopyPopover.propToCopy.set(e as string)}
          allowEdit
        />,
      ]}
      onSubmit={() => {
        const { name, type, location, family } =
          propertyCopyPopover.arguments.get({
            stealth: true,
          });

        const propToCopy = propertyCopyPopover.propToCopy.get({
          stealth: true,
        });

        const configsToCopyTo = getConfigsFromSelectedSet();

        deinherit_and_load_all_props(name, type, location, family).then(
          (res: any) => {
            if (propToCopy) {
              const value = res.res[propToCopy];
              configsToCopyTo.forEach((el) => {
                invoke("add_new_prop_to_file", {
                  path: el!.fileName,
                  propName: propToCopy,
                  propValue: JSON.stringify(value),
                })
                  .then(() => {
                    toast("Successfully wrote to file: " + el!.fileName, {
                      type: "success",
                    });
                  })
                  .catch((err: any) =>
                    toast(err.toString(), { type: "error" })
                  );
              });
            }
          }
        );
      }}
    />
  );
}
