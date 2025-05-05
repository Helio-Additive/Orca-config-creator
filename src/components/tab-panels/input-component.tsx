import { Field, Label } from "@headlessui/react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import DropdownInput from "./input-components/dropdown-input";
import ValueInput from "./input-components/value-input";
import { Tooltip } from "radix-ui";
import Infotip from "../tooltip/infotip";
import { ConfigType } from "../../lib/commons";
import ComboInput from "./input-components/combo-input";

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
}: {
  label?: string;
  type?: string;
  arraySize?: number;
  value?: string;
  arrayValue?: string[];
  placeholder?: string;
  onClick?: () => void;
  rightChild?: ReactNode;
  labelChild?: ReactNode;
  err?: string;
  inputClassName?: string;
  extraLabel?: string;
  labelClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string, idx?: number) => void;
  enumValues?: [string, string][];
  tooltip?: string;
  sideText?: string;
  search?: ConfigType;
  possibleValues?: string[];
  className?: string;
}) {
  const arr = Array.from(
    { length: arraySize ?? (arrayValue ? arrayValue?.length : 1) },
    (_, i) => i
  );

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
          <div className="flex items-center w-full max-w-[1024px] relative overflow-x-auto ">
            {arr.map((idx) => {
              const inputValue = arrayValue ? arrayValue[idx] : value;

              return (
                <div key={idx} className="flex flex-2/3 items-center min-w-fit">
                  {{
                    dropdown: (
                      <DropdownInput
                        value={inputValue!}
                        inputClassName={inputClassName}
                        onChange={onChange}
                        allowEdit={allowEdit}
                        err={err}
                        enumValues={enumValues!}
                        idx={idx}
                      />
                    ),
                    boolean: (
                      <DropdownInput
                        value={inputValue!}
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
                        idx={idx}
                      />
                    ),
                    combobox: (
                      <ComboInput
                        possibleValues={possibleValues!}
                        value={inputValue!}
                        inputClassName={inputClassName}
                        onChange={onChange}
                        allowEdit={allowEdit}
                        err={err}
                        idx={idx}
                        placeholder={placeholder}
                      />
                    ),
                  }[type] ?? (
                    <ValueInput
                      placeholder={placeholder}
                      value={inputValue}
                      inputClassName={inputClassName}
                      onClick={onClick}
                      onChange={onChange}
                      type={type}
                      allowEdit={allowEdit}
                      err={err}
                      idx={idx}
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
