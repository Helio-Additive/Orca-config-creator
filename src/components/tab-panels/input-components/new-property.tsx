import { MdAdd } from "react-icons/md";
import {
  ConfigType,
  findAvailableConfigs,
  getRelevantConfigsFromType,
} from "../../../lib/commons";
import { ConfigProperty } from "../../../lib/printer-configuration-options";
import FieldButton from "../field-button";
import InputComponent from "../input-component";
import { useEffect, useState } from "react";
import { useHookstate } from "@hookstate/core";
import { globalState } from "../../../lib/state-store";
import {
  ConfigOptionType,
  configOptionTypeToInputTypeString,
  isVector,
} from "../../../lib/config-option-types";
import { invoke } from "@tauri-apps/api/tauri";

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
    string | (string | undefined)[] | undefined
  >(undefined);
  const [valueType, setValueType] = useState("text");
  const [enumList, setEnumList] = useState([] as [string, string][]);
  const [possibleValues, setPossibleValues] = useState([] as string[]);

  const configType = editWindowState[editWindowKey].type.get({ stealth: true });

  const onPropertyValueChange = (value: string, idx?: number) => {
    if (isArray) {
      setPropValue((el) => {
        const newVal = [...(Array.isArray(el) ? (el as string[]) : [])];
        newVal.splice(idx!, 1, value);
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

    if (
      editWindowState[editWindowKey].properties.res.keys.includes(propName!)
    ) {
      setPropName(undefined);
      setPropValue(undefined);
      return;
    }

    if (configProperties[propName!])
      editWindowState[editWindowKey].knownKeys.merge([propName!]);
    else editWindowState[editWindowKey].unknownKeys.merge([propName!]);

    setPropName(undefined);
    setPropValue(undefined);
  };

  useEffect(() => {
    setValueType("text");
    setEnumList([]);
    setPossibleValues([]);
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

    const neededConfigs = getRelevantConfigsFromType(configType);

    const loadedSystemConfigs = neededConfigs!.installedConfigs.keys.flatMap(
      (familyName) =>
        neededConfigs!.installedConfigs[familyName].keys.map(
          (configName) =>
            neededConfigs!.installedConfigs[familyName][configName].get({
              stealth: true,
            }).fileName
        )
    );
    const userConfigs = neededConfigs!.loadedUserConfigs.keys.map((key) =>
      neededConfigs!.loadedUserConfigs[key].fileName.get({
        stealth: true,
      })
    );

    const allFiles = [...loadedSystemConfigs, ...userConfigs];

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
  }, [propName]);

  useEffect(() => {
    if (possibleValues.length > 0 && valueType === "text")
      setValueType("combobox");
  }, [possibleValues]);

  useEffect(() => {
    console.log(propValue);
  }, [propValue]);

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
      />
      {isArray && (
        <MdAdd
          className="text-text-primary h-full self-center text-3xl mr-1 hover:scale-125 active:scale-95 transition duration-200 "
          onClick={() =>
            setPropValue((curValue) => [...(curValue as string[]), undefined])
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
