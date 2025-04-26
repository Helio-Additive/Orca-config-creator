import { none, State, useHookstate } from "@hookstate/core";
import { invoke } from "@tauri-apps/api/tauri";
import { Tooltip } from "radix-ui";
import { ReactNode, useEffect } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import { FaEdit, FaSave } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdAdd } from "react-icons/md";
import { RiResetLeftFill } from "react-icons/ri";
import {
  NavigateFunction,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import InputComponent from "./components/tab-panels/input-component";
import Infotip from "./components/tooltip/infotip";
import {
  ConfigLocationType,
  ConfigType,
  deinherit_config_by_type,
  editConfigFile,
  findAvailableConfigs,
  folderOpener,
  renameConfig,
} from "./lib/commons";
import { configOptionTypeToInputTypeString } from "./lib/config-option-types";
import {
  ConfigProperty,
  printer_properties_map,
} from "./lib/printer-configuration-options";
import { globalState, KeyDetails, globalStateObject } from "./lib/state-store";

async function saveFile(
  fileName: string,
  type: ConfigType,
  location: ConfigLocationType,
  editWindowState: State<typeof globalStateObject.editWindowState, {}>,
  navigate: NavigateFunction,
  family?: string
) {
  const props = editWindowState[fileName].properties.res;
  const keyDetails = editWindowState[fileName].properties.keyDetails;
  const changedProps = editWindowState[fileName].changedProps;

  let newName: string | undefined = undefined;
  if (changedProps.keys.includes("name")) {
    newName = changedProps["name"].get({ stealth: true }) as string;
    changedProps["name"].set(none);
  }

  const newProps = {
    ...Object.fromEntries(
      Object.entries(props.get({ stealth: true })).filter(
        ([key, _]) => keyDetails[key].get({ stealth: true }).level === 0
      )
    ),
    ...changedProps.get({ stealth: true }),
  };

  await invoke("write_to_file", {
    path: fileName,
    content: JSON.stringify(newProps, null, 2),
  })
    .then(() => {
      toast("Wrote new configuration to file", { type: "success" });
      changedProps.set({});
    })
    .catch((error: any) => {
      toast(error.toString(), { type: "error" });
    });

  if (newName) {
    try {
      const name = props["name"].get({ stealth: true }) as string;
      const newFileName = await renameConfig(
        name,
        newName,
        type,
        location,
        family
      );

      editConfigFile(
        newName,
        editWindowState[fileName].type.get({ stealth: true }),
        newFileName,
        editWindowState[fileName].location.get({ stealth: true }),
        navigate,
        editWindowState[fileName].family.get({ stealth: true }),
        true
      );
    } catch (error: any) {
      toast(error.toString(), { type: "error" });
    }
  }
}

function LabelButtonTemplate({
  Icon,
  onClick,
  className,
  tooltip,
}: {
  className?: string;
  Icon: (a: { className?: string }) => ReactNode;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <Tooltip.Root delayDuration={800}>
      <Tooltip.Trigger asChild>
        <div
          onClick={onClick}
          className={twMerge(
            "text-text-primary text-2xl rounded-sm shadow-md ml-2",
            "hover:scale-110 transition duration-200 h-full",
            "active:scale-95",
            className
          )}
        >
          <Icon className="w-full h-full" />
        </div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Content>
          <Infotip tooltip={tooltip} />
        </Tooltip.Content>
      )}
    </Tooltip.Root>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={RiResetLeftFill}
      onClick={onClick}
      className="hover:-rotate-45"
      tooltip="reset"
    />
  );
}

function EditConfigButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={FaEdit}
      onClick={onClick}
      tooltip="Edit ancestor"
    />
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={MdAdd}
      onClick={onClick}
      className="hover:scale-125"
      tooltip="Add another element"
    />
  );
}

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={FaSave}
      onClick={onClick}
      className="hover:scale-110 p-2"
      tooltip="Save changes"
    />
  );
}

function ShowDirectoryButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={BsFiletypeJson}
      onClick={onClick}
      className="hover:scale-110 p-2"
      tooltip="Open containing folder"
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

  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const type: ConfigType = searchParams.get("type")! as ConfigType;
  const name: string = searchParams.get("name")!;
  const family: string | undefined = searchParams.get("family") ?? undefined;
  const location: ConfigLocationType = searchParams.get(
    "location"
  )! as ConfigLocationType;

  const navigate = useNavigate();
  const { editWindowState } = useHookstate(globalState);

  useEffect(() => {
    if (
      editWindowState[fileName].get({ stealth: true }) &&
      editWindowState[fileName].changedProps.keys.length === 0
    ) {
      deinherit_config_by_type(
        editWindowState[fileName].name.get({ stealth: true }),
        editWindowState[fileName].type.get({ stealth: true }),
        editWindowState[fileName].family.get({ stealth: true })
      )
        .then((res) => {
          const allKeysInRes = Object.keys(res.res);

          const propMap =
            propMaps[
              editWindowState[fileName].type.get({
                stealth: true,
              }) as ConfigType
            ] ?? {};

          const knownKeysTemp = Object.keys(propMap).filter((el) =>
            allKeysInRes.includes(el)
          );
          const unknownKeysTemp = allKeysInRes.filter(
            (el) => !knownKeysTemp.includes(el)
          );

          editWindowState[fileName].knownKeys.set(knownKeysTemp);
          editWindowState[fileName].unknownKeys.set(unknownKeysTemp);

          editWindowState[fileName].properties.set(res);
        })
        .catch((error: any) => toast(error.toString(), { type: "error" }));
    } else {
      if (!editWindowState[fileName].get({ stealth: true }))
        editWindowState[fileName].set({
          fileName: fileName,
          type: type,
          name: name,
          family: family,
          properties: { res: {}, keyDetails: {}, warnings: [] },
          changedProps: {},
          knownKeys: [],
          unknownKeys: [],
          location: location,
        });
    }
  }, [fileName, editWindowState[fileName].changedProps]);

  useEffect(() => {
    return () => {
      if (
        editWindowState[fileName].get({ stealth: true }) &&
        editWindowState[fileName].changedProps.keys.length === 0
      )
        editWindowState[fileName].set(none);
    };
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

  return editWindowState[fileName].get() ? (
    <div className="flex flex-col h-full">
      <div className="flex rounded-xl bg-transparent-base backdrop-blur-lg max-w-fit items-center p-1">
        <div
          className={`flex items-center  
            bg-background hover:bg-transparent-black-hover 
            p-1 rounded-xl h-full`}
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
        <ShowDirectoryButton
          onClick={() => {
            folderOpener(fileName);
          }}
        />
        {editWindowState[fileName].changedProps.keys.length > 0 && (
          <SaveButton
            onClick={() =>
              saveFile(
                fileName,
                type,
                location,
                editWindowState,
                navigate,
                family
              )
            }
          />
        )}
      </div>

      <div className="flex-1 min-h-0 mt-1 rounded-xl bg-transparent-base p-3 backdrop-blur-lg overflow-y-auto">
        {editWindowState[fileName].knownKeys.map((keyState) => {
          const key = keyState.get();
          const property = editWindowState[fileName].properties.res[key].get();
          const keyDetails =
            editWindowState[fileName].properties.keyDetails[key].get();

          const changedProperty =
            editWindowState[fileName].changedProps[key].get();

          const propMap =
            propMaps[
              editWindowState[fileName].type.get({
                stealth: true,
              }) as ConfigType
            ] ?? {};

          const knownProp = propMap[key];
          let inputType = configOptionTypeToInputTypeString(knownProp.type);

          const value = !Array.isArray(property)
            ? (changedProperty as string) ?? (property as string)
            : undefined;
          const arrayValue = Array.isArray(property)
            ? (changedProperty as string[]) ?? (property as string[])
            : undefined;

          let enumList = knownProp.enumList;
          if (knownProp.search) {
            enumList = findAvailableConfigs(
              knownProp.search! as ConfigType,
              editWindowState[fileName].location.get({ stealth: true }),
              editWindowState[fileName].family.get({ stealth: true })
            )?.map((el) => [el, el]);
            inputType = "dropdown";
          }

          const labelButtons = (
            <div className="flex">
              {(keyDetails.level as number) > 0 && (
                <EditConfigButton
                  onClick={() => {
                    editConfigFile(
                      keyDetails.configName as string,
                      editWindowState[fileName].type.get({ stealth: true }),
                      keyDetails.file as string,
                      editWindowState[fileName].location.get({ stealth: true }),
                      navigate,
                      keyDetails.family as string | undefined
                    );
                  }}
                />
              )}
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
              extraLabel={keyDetails.configName + " · " + keyDetails.level}
              labelClassName="text-lg"
              onChange={(value: string, idx = 0) =>
                handleChange(value, key, idx)
              }
              allowEdit={!knownProp.fixed}
              inputClassName={
                changedProperty
                  ? "outline-accent outline-2 -outline-offset-2 bg-accent/20"
                  : ""
              }
              type={inputType}
              enumValues={enumList}
              tooltip={knownProp.tooltip}
              sideText={knownProp.sidetext}
            />
          );
        })}
        {editWindowState[fileName].unknownKeys.map((keyState) => {
          const key = keyState.get();
          const property = editWindowState[fileName].properties.res[key].get();
          const keyDetails =
            editWindowState[fileName].properties.keyDetails[key].get();

          const changedProperty =
            editWindowState[fileName].changedProps[key].get();

          const value = !Array.isArray(property)
            ? (changedProperty as string) ?? (property as string)
            : undefined;
          const arrayValue = Array.isArray(property)
            ? (changedProperty as string[]) ?? (property as string[])
            : undefined;

          const labelButtons = (
            <div className="flex">
              {(keyDetails.level as number) > 0 && (
                <EditConfigButton
                  onClick={() => {
                    editConfigFile(
                      keyDetails.configName as string,
                      editWindowState[fileName].type.get({ stealth: true }),
                      keyDetails.file as string,
                      editWindowState[fileName].location.get({ stealth: true }),
                      navigate,
                      keyDetails.family as string | undefined
                    );
                  }}
                />
              )}
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
              extraLabel={keyDetails.configName + " · " + keyDetails.level}
              labelClassName="text-lg"
              onChange={(value: string, idx = 0) =>
                handleChange(value, key, idx)
              }
              inputClassName={
                changedProperty
                  ? "outline-accent outline-2 -outline-offset-2 bg-accent/20"
                  : ""
              }
              allowEdit
            />
          );
        })}
      </div>
    </div>
  ) : (
    <></>
  );
}
