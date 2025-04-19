import { none, State, useHookstate } from "@hookstate/core";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ConfigType, deinherit_config_by_type } from "./lib/commons";
import { globalState } from "./lib/state-store";
import InputComponent from "./components/tab-panels/input-component";
import {
  ConfigProperty,
  printer_properties_map,
} from "./lib/printer-configuration-options";
import { configOptionTypeToInputTypeString } from "./lib/config-option-types";

export default function EditConfig() {
  const propMaps: Record<ConfigType, Record<string, ConfigProperty>> = {
    printer: printer_properties_map,
    "printer-model": {},
    filament: {},
    process: {},
    vendor: {},
  };

  const [configType, setConfigType] = useState("printer" as ConfigType);

  const [knownKeys, setKnownKeys] = useState([] as string[]);
  const [unknownKeys, setUnknownKeys] = useState([] as string[]);
  const [numExtruders, setNumExtruders] = useState(1);

  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const navigate = useNavigate();

  const { editWindowState } = useHookstate(globalState);

  useEffect(() => {
    setConfigType(
      editWindowState[fileName].type.get({ stealth: true }) as ConfigType
    );

    deinherit_config_by_type(
      editWindowState[fileName].name.get({ stealth: true }),
      editWindowState[fileName].type.get({ stealth: true }),
      editWindowState[fileName].family.get({ stealth: true })
    ).then((res) => {
      const allKeysInRes = Object.keys(res.res);

      const propMap =
        propMaps[
          editWindowState[fileName].type.get({ stealth: true }) as ConfigType
        ] ?? {};

      const knownKeysTemp = Object.keys(propMap).filter((el) =>
        allKeysInRes.includes(el)
      );
      const unknownKeysTemp = allKeysInRes.filter(
        (el) => !knownKeysTemp.includes(el)
      );

      if (res.res["nozzle_diameter"])
        setNumExtruders(res.res["nozzle_diameter"].length);

      setKnownKeys(knownKeysTemp);
      setUnknownKeys(unknownKeysTemp);

      editWindowState[fileName].properties.set(res);
    });
  }, [fileName]);

  const handleChange = (
    value: string,
    stateProp: State<unknown, {}>,
    idx: number
  ) => {
    if (Array.isArray(stateProp.get({ stealth: true }))) {
      stateProp.merge({ [idx]: value });
    } else stateProp.set(value);
  };

  useEffect(() => {}, []);
  return (
    <div className="flex flex-col h-full">
      <div className="flex rounded-xl bg-transparent-base backdrop-blur-lg max-w-fit">
        <div
          className={`flex items-center aspect-square 
            bg-background hover:bg-transparent-black-hover 
            m-1 p-1 rounded-xl`}
          onClick={() => navigate(-1)}
        >
          <IoMdArrowRoundBack className="text-2xl text-text-primary" />
        </div>
        <div
          className={`py-0.5 pb-1.5 px-6 text-2xl m-1
                    font-semibold text-text-secondary`}
        >
          {editWindowState[fileName].name.get()}
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-1 rounded-xl bg-transparent-base p-3 backdrop-blur-lg overflow-y-auto">
        {knownKeys.map((key) => {
          const property = editWindowState[fileName].properties.res[key].get();
          const keyDetails =
            editWindowState[fileName].properties.keyDetails[key].get();

          const changedProperty =
            editWindowState[fileName].changedProps[key].get();

          const knownPrinterProp = printer_properties_map[key];
          const inputType = configOptionTypeToInputTypeString(
            knownPrinterProp.type
          );

          const value = !Array.isArray(property)
            ? (changedProperty as string) ?? (property as string)
            : undefined;
          const arrayValue = Array.isArray(property)
            ? (changedProperty as string[]) ?? (property as string[])
            : undefined;

          return (
            <InputComponent
              key={key}
              label={key}
              value={value}
              arrayValue={arrayValue}
              extraLabel={keyDetails[0] + " · " + keyDetails[1]}
              labelClassName="text-lg"
              onChange={(value: string, idx = 0) =>
                handleChange(
                  value,
                  editWindowState[fileName].changedProps[key],
                  idx
                )
              }
              allowEdit={!knownPrinterProp.fixed}
              inputClassName={
                changedProperty
                  ? "outline-input-changed-value outline-2 -outline-offset-2 bg-input-changed-value/20"
                  : ""
              }
              type={inputType}
              enumValues={
                inputType === "dropdown"
                  ? knownPrinterProp.enumList!
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
