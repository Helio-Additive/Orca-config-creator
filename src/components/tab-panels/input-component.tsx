import { Button, Field, Label } from "@headlessui/react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import DropdownInput from "./input-components/dropdown-input";
import ValueInput from "./input-components/value-input";
import { Tooltip } from "radix-ui";
import Infotip from "../tooltip/infotip";
import { ConfigType } from "../../lib/commons";
import ComboInput from "./input-components/combo-input";
import { ConfigNameAndPath } from "../../lib/bindings/ConfigNameAndPath";
import NameAndPathInput from "./input-components/name-and-path-input";
import { FaMinus } from "react-icons/fa";

export default function InputComponent({
  label,
  type = "text",
  value,
  arrayValue,
  placeholder,
  onClick,
  rightChild,
  labelChild,
  err,
  inputClassName,
  extraLabel,
  labelClassName,
  allowEdit,
  onChange = () => {},
  enumValues,
  tooltip,
  arraySize,
  sideText,
  possibleValues,
  className,
  isArray,
  arrayElementRemoveFunction,
}: {
  label?: string;
  type?: string;
  isArray?: boolean;
  arraySize?: number;
  value?: string;
  arrayValue?: string[] | ConfigNameAndPath[];
  placeholder?: string;
  onClick?: () => void;
  rightChild?: ReactNode;
  labelChild?: ReactNode;
  err?: string;
  inputClassName?: string;
  extraLabel?: string;
  labelClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string | ConfigNameAndPath, idx?: number) => void;
  enumValues?: [string, string][];
  tooltip?: string;
  sideText?: string;
  search?: ConfigType;
  possibleValues?: string[];
  className?: string;
  arrayElementRemoveFunction?: (idx: number) => void;
}) {
  const arr = Array.from(
    {
      length: arraySize ?? (isArray ? (arrayValue ? arrayValue.length : 0) : 1),
    },
    (_, i) => i
  );

  const directionClassName = isArray ? "flex-col max-h-40" : "";

  return (
    <Field className={twMerge("mb-3", className)}>
      <div className="flex items-center">
        {label && (
          <Label
            className={twMerge(
              "text-sm/6 font-medium text-text-primary",
              labelClassName
            )}
          >
            {label}
          </Label>
        )}

        {extraLabel && (
          <span
            className={twMerge(
              "text-sm/6 font-medium text-text-secondary ml-1",
              labelClassName
            )}
          >
            {" "}
            &middot; {extraLabel}{" "}
          </span>
        )}

        {labelChild && labelChild}
      </div>

      <Tooltip.Root delayDuration={1500}>
        <Tooltip.Trigger asChild>
          <div
            className={twMerge(
              "flex items-center w-full max-w-[1024px] relative overflow-x-auto ",
              directionClassName
            )}
          >
            {arr.map((idx) => {
              const inputValue = isArray ? arrayValue![idx] : value;

              return (
                <div
                  key={idx}
                  className="flex w-full items-center min-w-fit relative"
                >
                  {arrayElementRemoveFunction && (
                    <Button
                      className="mr-1 group"
                      onClick={() => arrayElementRemoveFunction(idx)}
                    >
                      <FaMinus className="size-4 fill-white/60 group-data-hover:fill-white" />
                    </Button>
                  )}
                  {{
                    dropdown: (
                      <DropdownInput
                        value={inputValue! as string}
                        inputClassName={inputClassName}
                        onChange={onChange}
                        allowEdit={allowEdit}
                        err={err}
                        enumValues={enumValues!}
                        idx={isArray ? idx : undefined}
                      />
                    ),
                    boolean: (
                      <DropdownInput
                        value={inputValue! as string}
                        inputClassName={inputClassName}
                        onChange={onChange}
                        allowEdit={allowEdit}
                        err={err}
                        enumValues={
                          enumValues ?? [
                            ["true", "1"],
                            ["false", "0"],
                          ]
                        }
                        idx={isArray ? idx : undefined}
                      />
                    ),
                    combobox: (
                      <ComboInput
                        possibleValues={possibleValues!}
                        value={inputValue! as string}
                        inputClassName={inputClassName}
                        onChange={onChange}
                        allowEdit={allowEdit}
                        err={err}
                        idx={isArray ? idx : undefined}
                        placeholder={placeholder}
                      />
                    ),
                    nameAndPath: (
                      <NameAndPathInput
                        placeholder={placeholder}
                        value={inputValue! as ConfigNameAndPath}
                        inputClassName={inputClassName}
                        onClick={onClick}
                        onChange={onChange}
                        type={type}
                        allowEdit={allowEdit}
                        err={err}
                        idx={isArray ? idx : undefined}
                      />
                    ),
                  }[type] ?? (
                    <ValueInput
                      placeholder={placeholder}
                      value={inputValue as string}
                      inputClassName={inputClassName}
                      onClick={onClick}
                      onChange={onChange}
                      type={type}
                      allowEdit={allowEdit}
                      err={err}
                      idx={isArray ? idx : undefined}
                    />
                  )}
                  <div className="mr-1 text-text-secondary">{sideText}</div>
                </div>
              );
            })}
            {rightChild && rightChild}
          </div>
        </Tooltip.Trigger>
        {tooltip && (
          <Tooltip.Content>
            <Infotip tooltip={tooltip} />
          </Tooltip.Content>
        )}
      </Tooltip.Root>
    </Field>
  );
}
