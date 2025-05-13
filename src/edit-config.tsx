import { none, useHookstate } from "@hookstate/core";
import { Tooltip } from "radix-ui";
import { ReactNode, useEffect, useState } from "react";
import { BsFiletypeJson } from "react-icons/bs";
import { FaEdit, FaSave } from "react-icons/fa";
import { IoIosWarning, IoMdArrowRoundBack } from "react-icons/io";
import { MdAdd, MdOutlineError } from "react-icons/md";
import { RiDeleteBin6Line, RiResetLeftFill } from "react-icons/ri";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import InputComponent from "./components/tab-panels/input-component";
import NewProperty from "./components/tab-panels/input-components/new-property";
import Infotip from "./components/tooltip/infotip";
import {
  checkNameCollision,
  ConfigLocationType,
  ConfigType,
  deinherit_and_load_all_props_by_props,
  deinherit_config_by_type,
  editConfigFile,
  findAvailableConfigs,
  folderOpener,
  getPropMapFromType,
} from "./lib/commons";
import {
  configOptionTypeToInputTypeString,
  isVector,
} from "./lib/config-option-types";
import { saveFile } from "./lib/edit-config-helpers";
import { globalState, Warning } from "./lib/state-store";

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
        <Tooltip.Portal>
          <Tooltip.Content>
            <Infotip tooltip={tooltip} />
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}

function WarnIconTemplate({
  warnings,
  Icon,
  className,
  tooltipClassName,
}: {
  className?: string;
  tooltipClassName?: string;
  Icon: (a: { className?: string }) => ReactNode;
  warnings: Warning[];
}) {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>
        <div className={twMerge("text-text-primary text-2xl", className)}>
          <Icon className="w-full h-full" />
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className={twMerge(
            "bg-transparent-warn p-1 px-2 text-text-secondary font-bold z-40 rounded-xl",
            tooltipClassName
          )}
        >
          {warnings.map((el, idx) => (
            <div key={idx}> &middot; {el.text} </div>
          ))}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={RiResetLeftFill}
      onClick={onClick}
      className="hover:-rotate-45"
      tooltip="Reset"
    />
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={RiDeleteBin6Line}
      onClick={onClick}
      tooltip="Delete field"
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

export function AddButton({ onClick }: { onClick: () => void }) {
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

function ResetAllButton({ onClick }: { onClick: () => void }) {
  return (
    <LabelButtonTemplate
      Icon={RiResetLeftFill}
      onClick={onClick}
      className="hover:scale-110 p-2"
      tooltip="Reset all"
    />
  );
}

export default function EditConfig() {
  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const type: ConfigType = searchParams.get("type")! as ConfigType;
  const name: string = searchParams.get("name")!;
  const family: string | undefined = searchParams.get("family") ?? undefined;
  const newFile: string | undefined = searchParams.get("newFile") ?? undefined;
  const location: ConfigLocationType = searchParams.get(
    "location"
  )! as ConfigLocationType;

  const navigate = useNavigate();
  const { editWindowState } = useHookstate(globalState);

  const propMap = getPropMapFromType(type);

  const [criticalErrorsExist, setCriticalErrorsExist] = useState(false);

  useEffect(() => {
    if (
      editWindowState[fileName].get({ stealth: true }) &&
      editWindowState[fileName].changedProps.keys.length === 0 &&
      !newFile
    ) {
      deinherit_config_by_type(
        editWindowState[fileName].name.get({ stealth: true }),
        editWindowState[fileName].type.get({ stealth: true }),
        editWindowState[fileName].family.get({ stealth: true })
      )
        .then((res) => {
          const allKeysInRes = Object.keys(res.res);

          const knownKeysTemp = new Set(
            Object.keys(propMap).filter((el) => allKeysInRes.includes(el))
          );
          const unknownKeysTemp = new Set(
            allKeysInRes.filter((el) => !knownKeysTemp.has(el))
          );

          editWindowState[fileName].knownKeys.set(knownKeysTemp);
          editWindowState[fileName].unknownKeys.set(unknownKeysTemp);

          editWindowState[fileName].properties.set(res);
        })
        .catch((error: any) => toast(error.toString(), { type: "error" }));
    } else if (
      editWindowState[fileName].get({ stealth: true }) &&
      editWindowState[fileName].changedProps.keys.length === 0 &&
      newFile
    ) {
      const knownKeysTemp = Object.keys(propMap).filter(
        (el) => propMap[el].required
      );

      const changedPropsTemp = knownKeysTemp.reduce((acc, el) => {
        acc[el] = structuredClone(propMap[el].default);
        return acc;
      }, {} as Record<string, any>);

      changedPropsTemp["type"] = type;
      editWindowState[fileName].merge({
        changedProps: changedPropsTemp,
        knownKeys: new Set(knownKeysTemp),
      });
    } else {
      if (!editWindowState[fileName].get({ stealth: true }))
        editWindowState[fileName].set({
          fileName: fileName,
          type: type,
          name: name,
          family: family,
          properties: {
            res: {},
            keyDetails: {},
            warnings: {},
          },
          changedProps: {},
          deleteKeys: [],
          knownKeys: new Set(),
          unknownKeys: new Set(),
          location: location,
        });
    }

    if (editWindowState[fileName].changedProps.keys.length > 0) {
      const newProps = {
        ...Object.fromEntries(
          Object.entries(
            editWindowState[fileName].properties.res.get({ stealth: true })
          ).filter(
            ([key, _]) =>
              editWindowState[fileName].properties.keyDetails[key].get({
                stealth: true,
              }).level === 0 &&
              !editWindowState[fileName].deleteKeys
                .get({ stealth: true })
                .includes(key)
          )
        ),
        ...editWindowState[fileName].changedProps.get({ stealth: true }),
      };

      deinherit_and_load_all_props_by_props(
        newProps,
        type,
        fileName,
        family
      ).then(
        ({
          warnings: analysedWarnings,
        }: {
          warnings: Record<string, Warning[]>;
        }) => {
          editWindowState[fileName].properties.warnings.set(analysedWarnings);

          const changedName = editWindowState[fileName].changedProps[
            "name"
          ].get({ stealth: true });
          if (
            changedName !== undefined &&
            changedName !==
              editWindowState[fileName].properties.res["name"].get({
                stealth: true,
              })
          ) {
            if (
              checkNameCollision(changedName as string, type, location, family)
            ) {
              const tempWarningsState =
                editWindowState[fileName].properties.warnings["name"];
              const tempWarning: Warning = {
                text: "Name already exists. This can overwrite some other file",
                type: "error",
              };
              tempWarningsState.get({ stealth: true })
                ? tempWarningsState.merge([tempWarning])
                : tempWarningsState.set([tempWarning]);
            }

            if ((changedName as string).length === 0) {
              const tempWarningsState =
                editWindowState[fileName].properties.warnings["name"];
              const tempWarning: Warning = {
                text: "Name cannot be empty",
                type: "critical",
              };
              tempWarningsState.get({ stealth: true })
                ? tempWarningsState.merge([tempWarning])
                : tempWarningsState.set([tempWarning]);
            }
          }
        }
      );
    }
  }, [fileName, editWindowState[fileName].changedProps]);

  useEffect(() => {
    if (editWindowState[fileName] && editWindowState[fileName].properties) {
      const tempWarnings = editWindowState[fileName].properties.warnings.get({
        stealth: true,
      });

      if (tempWarnings) {
        const hasCriticalErrors = Object.keys(tempWarnings).reduce(
          (acc, el) => {
            return acc ||
              tempWarnings[el].find((warn) => warn.type === "critical")
              ? true
              : false;
          },
          false
        );

        setCriticalErrorsExist(hasCriticalErrors);
      }
    }
  }, [editWindowState[fileName].properties]);

  useEffect(() => {
    return () => {
      if (
        editWindowState[fileName].get({ stealth: true }) &&
        editWindowState[fileName].changedProps.keys.length === 0
      )
        editWindowState[fileName].set(none);

      if (newFile) editWindowState[fileName].set(none);
    };
  }, []);

  const handleChange = (value: string, key: string, idx?: number) => {
    const property = editWindowState[fileName].properties.res[key].get();
    const changedProperty = editWindowState[fileName].changedProps[key];

    if (idx !== undefined) {
      if (changedProperty.get({ stealth: true }))
        changedProperty.merge({ [idx]: value });
      else {
        const arr = [...(property as unknown[])];
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
        {(editWindowState[fileName].changedProps.keys.length > 0 ||
          editWindowState[fileName].deleteKeys.length > 0) &&
          !criticalErrorsExist && (
            <SaveButton
              onClick={() =>
                saveFile(
                  fileName,
                  type,
                  location,
                  editWindowState,
                  navigate,
                  family,
                  newFile !== undefined
                )
              }
            />
          )}
        {(editWindowState[fileName].changedProps.keys.length > 0 ||
          editWindowState[fileName].deleteKeys.length > 0) && (
          <ResetAllButton
            onClick={() => {
              editWindowState[fileName].knownKeys.set(new Set());
              editWindowState[fileName].changedProps.set({});
              editWindowState[fileName].deleteKeys.set([]);
            }}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 mt-1 rounded-xl bg-transparent-base p-3 backdrop-blur-lg overflow-y-auto">
        {Array.from(editWindowState[fileName].knownKeys.get()).map((key) => {
          const knownProp = propMap[key];

          const property = editWindowState[fileName].properties.res[key].get();

          const warningsObj =
            editWindowState[fileName].properties.warnings[key].get();

          const warnings = warningsObj
            ? warningsObj.filter((el) => el.type === "warning")
            : undefined;
          const errors = warningsObj
            ? warningsObj.filter((el) => el.type === "error")
            : undefined;
          const criticalErrors = warningsObj
            ? warningsObj.filter((el) => el.type === "critical")
            : undefined;

          const changedProperty =
            editWindowState[fileName].changedProps[key].get();
          const keyDetails = editWindowState[fileName].properties.keyDetails[
            key
          ].get() ?? { configName: name, level: 0, family, file: fileName };

          //const isNewProp = changedProperty !== undefined && property === undefined;

          const markedForDeletion = editWindowState[fileName].deleteKeys
            .get()
            .includes(key);

          const isBaseProp = keyDetails.level === 0;

          let inputType = configOptionTypeToInputTypeString(knownProp.type);

          const isArray = changedProperty
            ? Array.isArray(changedProperty)
            : property
            ? Array.isArray(property)
            : isVector(knownProp.type);

          const value = !isArray
            ? (changedProperty as string) ?? (property as string)
            : undefined;
          const arrayValue: string[] | undefined = isArray
            ? (changedProperty as string[]) ?? (property as string[])
            : undefined;

          if (!value && !arrayValue && !knownProp.required) {
            editWindowState[fileName].knownKeys.set((el) => {
              const newSet = new Set(Array.from(el).filter((pr) => pr !== key));
              return newSet;
            });
            return <></>;
          }

          if (
            knownProp.required &&
            !editWindowState[fileName].properties.res.keys.includes(key) &&
            !editWindowState[fileName].changedProps.keys.includes(key)
          ) {
            editWindowState[fileName].changedProps[key].set(knownProp.default);
          }

          let enumList = knownProp.enumList;
          let possibleValues: string[] | undefined = undefined;

          if (knownProp.search) {
            possibleValues = [
              ...findAvailableConfigs(
                knownProp.search! as ConfigType,
                editWindowState[fileName].location.get({ stealth: true }),
                editWindowState[fileName].family.get({ stealth: true })
              )!,
            ].filter((el) => el !== name);
            inputType = "combobox";
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
              {isArray && (
                <AddButton
                  onClick={() => {
                    if (changedProperty)
                      editWindowState[fileName].changedProps[key].merge([
                        arrayValue![arrayValue!.length - 1],
                      ]);
                    else if (arrayValue)
                      editWindowState[fileName].changedProps[key].set([
                        ...arrayValue!,
                        arrayValue![arrayValue!.length - 1],
                      ]);
                    else
                      editWindowState[fileName].changedProps[key].set([
                        undefined,
                      ]);
                  }}
                />
              )}
              {(changedProperty || markedForDeletion) && (
                <ResetButton
                  onClick={() => {
                    editWindowState[fileName].changedProps[key].set(none);
                  }}
                />
              )}
              {!knownProp.required && !markedForDeletion && isBaseProp && (
                <DeleteButton
                  onClick={() => {
                    editWindowState[fileName].deleteKeys.merge([key]);
                    editWindowState[fileName].changedProps[key].set(none);
                  }}
                />
              )}
              {warnings && warnings.length > 0 && (
                <WarnIconTemplate
                  Icon={IoIosWarning}
                  className="text-transparent-warn ml-1"
                  warnings={warnings as Warning[]}
                />
              )}
              {errors && errors.length > 0 && (
                <WarnIconTemplate
                  Icon={MdOutlineError}
                  className="text-transparent-warn ml-1"
                  warnings={errors as Warning[]}
                  tooltipClassName="bg-transparent-error text-text-primary"
                />
              )}
              {criticalErrors && criticalErrors.length > 0 && (
                <WarnIconTemplate
                  Icon={MdOutlineError}
                  className="text-transparent-error ml-1"
                  warnings={criticalErrors as Warning[]}
                  tooltipClassName="bg-transparent-error text-text-primary"
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
              labelClassName={
                "text-lg " + (markedForDeletion ? "opacity-50" : "")
              }
              onChange={(value: string, idx = undefined) =>
                handleChange(value, key, idx)
              }
              allowEdit={!knownProp.fixed && !markedForDeletion}
              inputClassName={
                changedProperty
                  ? "outline-accent outline-2 -outline-offset-2 bg-accent/20"
                  : markedForDeletion
                  ? "opacity-50"
                  : ""
              }
              type={inputType}
              enumValues={enumList}
              tooltip={knownProp.tooltip}
              sideText={knownProp.sidetext}
              possibleValues={possibleValues}
              isArray={isArray}
            />
          );
        })}

        {Array.from(editWindowState[fileName].unknownKeys.get()).map((key) => {
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

          if (!value && !arrayValue) {
            editWindowState[fileName].unknownKeys.set((el) => {
              const newSet = new Set(Array.from(el).filter((pr) => pr !== key));
              return newSet;
            });
            return <></>;
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

          const markedForDeletion = editWindowState[fileName].deleteKeys
            .get()
            .includes(key);

          return (
            <InputComponent
              labelChild={labelButtons}
              key={key}
              label={key}
              value={value}
              arrayValue={arrayValue}
              extraLabel={keyDetails.configName + " · " + keyDetails.level}
              labelClassName={
                "text-lg " + (markedForDeletion ? "opacity-50" : "")
              }
              onChange={(value: string, idx = 0) =>
                handleChange(value, key, idx)
              }
              inputClassName={
                changedProperty
                  ? "outline-accent outline-2 -outline-offset-2 bg-accent/20"
                  : markedForDeletion
                  ? "opacity-50"
                  : ""
              }
              allowEdit={!markedForDeletion}
              isArray={Array.isArray(property)}
            />
          );
        })}
      </div>

      <div className="min-h-0 mt-1 rounded-xl bg-transparent-base p-3 backdrop-blur-lg overflow-y-auto">
        <NewProperty configProperties={propMap} editWindowKey={fileName} />
      </div>
    </div>
  ) : (
    <></>
  );
}
