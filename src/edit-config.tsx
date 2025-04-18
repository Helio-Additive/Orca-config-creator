import { none, State, useHookstate } from "@hookstate/core";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deinherit_config_by_type } from "./lib/commons";
import { globalState } from "./lib/state-store";
import InputComponent from "./components/tab-panels/input-component";
import { printer_properties_map } from "./lib/printer-configuration-options";
import { configOptionTypeToInputTypeString } from "./lib/config-option-types";

export default function EditConfig() {
  const [knownKeys, setKnownKeys] = useState([] as string[]);
  const [unknownKeys, setUnknownKeys] = useState([] as string[]);

  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const navigate = useNavigate();

  const { editWindowState } = useHookstate(globalState);

  useEffect(() => {
    deinherit_config_by_type(
      editWindowState[fileName].name.get({ stealth: true }),
      editWindowState[fileName].type.get({ stealth: true }),
      editWindowState[fileName].family.get({ stealth: true })
    ).then((res) => {
      const allKeysInRes = Object.keys(res.res);
      const knownKeysTemp = Object.keys(printer_properties_map).filter((el) =>
        allKeysInRes.includes(el)
      );
      const unknownKeysTemp = allKeysInRes.filter(
        (el) => !knownKeysTemp.includes(el)
      );

      setKnownKeys(knownKeysTemp);
      setUnknownKeys(unknownKeysTemp);

      editWindowState[fileName].properties.set(res);
    });
  }, []);

  const handleChange = (value: string, stateProp: State<unknown, {}>) => {
    stateProp.set(value);
  };

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
          return changedProperty ? (
            <InputComponent
              key={key}
              label={key}
              value={changedProperty as string}
              extraLabel={keyDetails[0] + " · " + keyDetails[1]}
              labelClassName="text-lg"
              onChange={(value: string) =>
                handleChange(value, editWindowState[fileName].changedProps[key])
              }
              allowEdit={!knownPrinterProp.fixed}
              inputClassName="outline-input-changed-value outline-2 -outline-offset-2"
              type={inputType}
              enumValues={
                inputType === "dropdown"
                  ? knownPrinterProp.enumList!
                  : undefined
              }
            />
          ) : (
            <InputComponent
              key={key}
              label={key}
              value={property as string}
              extraLabel={keyDetails[0] + " · " + keyDetails[1]}
              labelClassName="text-lg"
              onChange={(value: string) =>
                handleChange(value, editWindowState[fileName].changedProps[key])
              }
              allowEdit={!knownPrinterProp.fixed}
              type={configOptionTypeToInputTypeString(knownPrinterProp.type)}
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
