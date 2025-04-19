import {
  Field,
  Input,
  Label,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FaChevronDown } from "react-icons/fa";
import ValueInput from "./input-components/value-input";
import DropdownInput from "./input-components/dropdown-input";

export default function InputComponent({
  label,
  type = "text",
  value,
  arrayValue,
  placeholder,
  onClick,
  rightChild,
  err,
  inputClassName,
  extraLabel,
  labelClassName,
  allowEdit,
  onChange = () => {},
  enumValues,
  tooltip,
  arraySize,
}: {
  label?: string;
  type?: string;
  arraySize?: number;
  value?: string;
  arrayValue?: string[];
  placeholder?: string;
  onClick?: () => void;
  rightChild?: ReactNode;
  err?: string;
  inputClassName?: string;
  extraLabel?: string;
  labelClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string, idx?: number) => void;
  enumValues?: [string, string][];
  tooltip?: string;
}) {
  const arr = Array.from(
    { length: arraySize ?? (arrayValue ? arrayValue?.length : 1) },
    (_, i) => i
  );

  return (
    <Field className={"mb-3"}>
      <div className="flex">
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
      </div>
      <div className="flex w-full max-w-[1024px] relative">
        {arr.map((idx) => {
          const inputValue = arrayValue ? arrayValue[idx] : value;

          return (
            {
              dropdown: (
                <DropdownInput
                  key={idx}
                  value={inputValue!}
                  inputClassName={inputClassName}
                  onChange={onChange}
                  allowEdit={allowEdit}
                  err={err}
                  enumValues={enumValues!}
                />
              ),
              boolean: (
                <DropdownInput
                  key={idx}
                  value={inputValue!}
                  inputClassName={inputClassName}
                  onChange={onChange}
                  allowEdit={allowEdit}
                  err={err}
                  enumValues={[
                    ["true", "true"],
                    ["false", "false"],
                  ]}
                />
              ),
            }[type] ?? (
              <ValueInput
                key={idx}
                placeholder={placeholder}
                value={inputValue}
                inputClassName={inputClassName}
                onClick={onClick}
                onChange={onChange}
                type={type}
                allowEdit={allowEdit}
                err={err}
              />
            )
          );
        })}

        {rightChild && rightChild}
      </div>
    </Field>
  );
}
