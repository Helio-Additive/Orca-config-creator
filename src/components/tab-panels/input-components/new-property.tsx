import { MdAdd } from "react-icons/md";
import { ConfigType } from "../../../lib/commons";
import { ConfigProperty } from "../../../lib/printer-configuration-options";
import FieldButton from "../field-button";
import InputComponent from "../input-component";
import { useEffect, useState } from "react";
import { useHookstate } from "@hookstate/core";
import { globalState } from "../../../lib/state-store";
import { isVector } from "../../../lib/config-option-types";

export default function NewProperty({
  configProperties,
  editWindowKey,
}: {
  isArray?: boolean;
  configProperties: Record<string, ConfigProperty>;
  editWindowKey: string;
}) {
  const [isArray, setIsArray] = useState(false);
  const { editWindowState } = useHookstate(globalState);

  const [propName, setPropName] = useState<string | undefined>(undefined);
  const [propValue, setPropValue] = useState<string | string[] | undefined>(
    undefined
  );

  const onPropertyValueChange = (value: string, idx: number) => {
    if (isArray) {
      setPropValue((el) => {
        const newVal = [...(Array.isArray(el) ? (el as string[]) : [])];
        newVal.splice(idx, 1, value);
        return newVal;
      });
    } else {
      setPropValue(value);
    }
  };

  const saveFunc = () => {
    const configName = editWindowState[editWindowKey].name.get({
      stealth: true,
    });
    const fileName = editWindowState[editWindowKey].fileName.get({
      stealth: true,
    });
    const family = editWindowState[editWindowKey].family.get({ stealth: true });

    editWindowState[editWindowKey].properties.keyDetails[propName!].set({
      configName,
      level: 0,
      family,
      file: fileName,
    });
    editWindowState[editWindowKey].changedProps[propName!].set(propValue!);

    if (editWindowState[editWindowKey].properties.res.keys.includes(propName!))
      return;

    if (configProperties[propName!])
      editWindowState[editWindowKey].knownKeys.merge([propName!]);
    else editWindowState[editWindowKey].unknownKeys.merge([propName!]);
  };

  useEffect(() => {
    if (propName && configProperties[propName]) {
      if (isVector(configProperties[propName].type)) setIsArray(true);
      else setIsArray(false);
    }
  }, [propName]);

  return (
    <div className="flex max-w-[1024px] items-center">
      <InputComponent
        className="w-fit m-0"
        allowEdit
        enumValues={[
          ["array", "array"],
          ["value", "value"],
        ]}
        value={isArray ? "array" : "value"}
        type="dropdown"
        onChange={(val) =>
          val === "array" ? setIsArray(true) : setIsArray(false)
        }
      />
      <InputComponent
        className="flex-1/2 m-0"
        allowEdit
        placeholder="property"
        possibleValues={Object.keys(configProperties)}
        type="combobox"
        value={propName}
        onChange={setPropName}
      />
      (
      <InputComponent
        className="flex-1/2 m-0"
        allowEdit
        placeholder="value"
        value={!isArray ? (propValue as string | undefined) : undefined}
        arrayValue={isArray ? (propValue as string[] | undefined) : undefined}
        onChange={onPropertyValueChange}
      />
      )
      {isArray && (
        <MdAdd className="text-text-primary h-full self-center text-3xl mr-1 hover:scale-125 active:scale-95 transition duration-200 " />
      )}
      <FieldButton
        text="Add"
        onClick={saveFunc}
        className="flex-1/8 h-fit mr-1"
        disabled={propValue === undefined || propValue === undefined}
      />
    </div>
  );
}
