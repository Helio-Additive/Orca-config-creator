import { none, State, useHookstate } from "@hookstate/core";
import { ReactNode, useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ConfigType,
  deinherit_config_by_type,
  editConfigFile,
} from "./lib/commons";
import { globalState } from "./lib/state-store";
import InputComponent from "./components/tab-panels/input-component";
import {
  ConfigProperty,
  printer_properties_map,
} from "./lib/printer-configuration-options";
import { configOptionTypeToInputTypeString } from "./lib/config-option-types";
import { IconType } from "react-icons/lib";
import { RiResetLeftFill } from "react-icons/ri";
import { twMerge } from "tailwind-merge";
import { BsFiletypeJson } from "react-icons/bs";
import { MdAdd } from "react-icons/md";

function LabelButtonTemplate({
  Icon,
  onClick,
  className,
}: {
  className?: string;
  Icon: (a: { className?: string }) => ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        "text-text-primary text-2xl rounded-xl bg-transparent-white-input shadow-md ml-2",
        "hover:scale-110 transition duration-200",
        "active:scale-95",
        className
      )}
    >
      <Icon className="w-full h-full" />
    </div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={RiResetLeftFill}
      onClick={onClick}
      className="hover:-rotate-45"
    />
  );
}

function EditConfigButton({ onClick }: { onClick: () => void }) {
  return <LabelButtonTemplate Icon={BsFiletypeJson} onClick={onClick} />;
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={MdAdd}
      onClick={onClick}
      className="hover:scale-125"
    />
  );
}

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

  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const navigate = useNavigate();

  const { editWindowState } = useHookstate(globalState);

  useEffect(() => {
    console.count("useEffect");
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

      setKnownKeys(knownKeysTemp);
      setUnknownKeys(unknownKeysTemp);

      editWindowState[fileName].properties.set(res);
    });
  }, []);

  const handleChange = (value: string, key: string, idx: number) => {
    const property = editWindowState[fileName].properties.res[key].get();
    const changedProperty = editWindowState[fileName].changedProps[key];
    if (Array.isArray(property)) {
      if (changedProperty.get({ stealth: true }))
        changedProperty.merge({ [idx]: value });
      else {
        const arr = [...property];
        arr.splice(idx, 1, value);

        changedProperty.set(arr);
      }
    } else changedProperty.set(value);
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

          const value = !Array.isArray(property)
            ? (changedProperty as string) ?? (property as string)
            : undefined;
          const arrayValue = Array.isArray(property)
            ? (changedProperty as string[]) ?? (property as string[])
            : undefined;

          const labelButtons = (
            <div className="flex">
              <EditConfigButton
                onClick={() => {
                  editConfigFile(
                    keyDetails[0] as string,
                    editWindowState[fileName].type.get({ stealth: true }),
                    keyDetails[3] as string,
                    navigate,
                    keyDetails[2] as string | undefined
                  );
                }}
              />
              {arrayValue && (
                <AddButton
                  onClick={() => {
                    if (changedProperty)
                      editWindowState[fileName].changedProps[key].merge([
                        arrayValue[arrayValue.length - 1],
                      ]);
                    else
                      editWindowState[fileName].changedProps[key].set([
                        ...arrayValue,
                        arrayValue[arrayValue.length - 1],
                      ]);
                  }}
                />
              )}
              {changedProperty && (
                <ResetButton
                  onClick={() =>
                    editWindowState[fileName].changedProps[key].set(none)
                  }
                />
              )}
            </div>
          );

          return (
            <InputComponent
              labelChild={labelButtons}
              key={key}
              label={key}
              value={value}
              arrayValue={arrayValue}
              extraLabel={keyDetails[0] + " · " + keyDetails[1]}
              labelClassName="text-lg"
              onChange={(value: string, idx = 0) =>
                handleChange(value, key, idx)
              }
              allowEdit={!knownPrinterProp.fixed}
              inputClassName={
                changedProperty
                  ? "outline-input-changed-value outline-2 -outline-offset-2 bg-input-changed-value/20"
                  : ""
              }
              type={inputType}
              enumValues={knownPrinterProp.enumList}
            />
          );
        })}
      </div>
    </div>
  );
}
