import { useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import { ConfigType, findAvailableConfigs } from "../../../lib/commons";
import {
  configOptionTypeToInputTypeString,
  isVector,
} from "../../../lib/config-option-types";
import { getFilesToSearch } from "../../../lib/edit-config-helpers";
import { ConfigProperty } from "../../../lib/printer-configuration-options";
import { globalState } from "../../../lib/state-store";
import FieldButton from "../field-button";
import InputComponent from "../input-component";
import { ConfigNameAndPath } from "../../../lib/bindings/ConfigNameAndPath";

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
  const [propValue, setPropValue] = useState<
    | string
    | (string | undefined)[]
    | (ConfigNameAndPath | undefined)[]
    | undefined
  >(undefined);
  const [valueType, setValueType] = useState("text");
  const [enumList, setEnumList] = useState(
    undefined as [string, string][] | undefined
  );
  const [possibleValues, setPossibleValues] = useState(
    undefined as string[] | undefined
  );

  const configType = editWindowState[editWindowKey].type.get({ stealth: true });

  const onPropertyValueChange = (
    value: string | ConfigNameAndPath,
    idx?: number
  ) => {
    if (isArray) {
      setPropValue((el) => {
        const newVal = [
          ...(Array.isArray(el) ? (el as string[] | ConfigNameAndPath[]) : []),
        ];
        newVal.splice(idx!, 1, value);
        return newVal as string[] | ConfigNameAndPath[];
      });
    } else {
      setPropValue(value as string);
    }
  };

  const saveFunc = () => {
    editWindowState[editWindowKey].changedProps[propName!].set(propValue!);

    if (
      editWindowState[editWindowKey].knownKeys
        .get({ stealth: true })
        .has(propName!) ||
      editWindowState[editWindowKey].unknownKeys
        .get({ stealth: true })
        .has(propName!)
    ) {
      setPropName(undefined);
      setPropValue(undefined);
      return;
    }

    if (configProperties[propName!])
      editWindowState[editWindowKey].knownKeys.set((p) => {
        const newSet = new Set(p);
        newSet.add(propName!);
        return newSet;
      });
    else
      editWindowState[editWindowKey].unknownKeys.set((p) => {
        const newSet = new Set(p);
        newSet.add(propName!);
        return newSet;
      });

    setPropName(undefined);
    setPropValue(undefined);
  };

  useEffect(() => {
    setValueType("text");
    setEnumList(undefined);
    setPossibleValues(undefined);
    setPropValue(undefined);

    if (propName && configProperties[propName]) {
      if (isVector(configProperties[propName].type)) setIsArray(true);
      else setIsArray(false);

      setValueType(
        configOptionTypeToInputTypeString(configProperties[propName].type)
      );

      if (configProperties[propName].enumList) {
        setEnumList(configProperties[propName].enumList!);
      }
    }

    const allFiles = getFilesToSearch(configType);

    if (
      propName &&
      configProperties[propName] &&
      configProperties[propName].search
    ) {
      setPossibleValues(
        [
          ...findAvailableConfigs(
            configProperties[propName].search! as ConfigType,
            editWindowState[editWindowKey].location.get({ stealth: true }),
            editWindowState[editWindowKey].family.get({ stealth: true })
          )!,
        ].filter(
          (el) =>
            el !== editWindowState[editWindowKey].name.get({ stealth: true })
        )
      );
    } else {
      invoke("find_possible_values", {
        filesToCheck: allFiles,
        propName: propName,
      }).then((el) => {
        const typedEl = el as (string | string[])[] | null;
        console.log(typedEl);

        if (typedEl === null) setPossibleValues([]);
        else
          setPossibleValues(
            typedEl.flatMap((x) => {
              if (Array.isArray(x)) return x;
              else return [x];
            })
          );
      });
    }
  }, [propName]);

  useEffect(() => {
    if (possibleValues && possibleValues.length > 0 && valueType === "text")
      setValueType("combobox");
  }, [possibleValues]);

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
        onChange={(val: string | ConfigNameAndPath) =>
          setPropName(val as string)
        }
      />
      <InputComponent
        className="flex-1/2 m-0"
        allowEdit
        placeholder="value"
        value={!isArray ? (propValue as string | undefined) : undefined}
        arrayValue={isArray ? (propValue as string[] | undefined) : undefined}
        onChange={onPropertyValueChange}
        enumValues={enumList}
        possibleValues={possibleValues}
        type={valueType}
        isArray={isArray}
      />
      {isArray && (
        <MdAdd
          className="text-text-primary h-full self-center text-3xl mr-1 hover:scale-125 active:scale-95 transition duration-200 "
          onClick={() =>
            setPropValue((curValue) => [
              ...((curValue as any[]) ?? []),
              undefined,
            ])
          }
        />
      )}
      <FieldButton
        text="Add"
        onClick={saveFunc}
        className="flex-1/8 h-fit mr-1"
        disabled={
          propName === undefined ||
          propName === null ||
          propValue === undefined ||
          propValue === null ||
          propName?.length === 0 ||
          propValue?.length === 0
        }
      />
    </div>
  );
}
