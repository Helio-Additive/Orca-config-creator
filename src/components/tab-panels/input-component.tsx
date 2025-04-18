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
}: {
  label?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  rightChild?: ReactNode;
  err?: string;
  inputClassName?: string;
  extraLabel?: string;
  labelClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string) => void;
  enumValues?: [string, string][];
}) {
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
        {{
          dropdown: (
            <DropdownInput
              value={value!}
              inputClassName={inputClassName}
              onChange={onChange}
              allowEdit={allowEdit}
              err={err}
              enumValues={enumValues!}
            />
          ),
        }[type] ?? (
          <ValueInput
            placeholder={placeholder}
            value={value ?? placeholder}
            inputClassName={inputClassName}
            onClick={onClick}
            onChange={onChange}
            type={type}
            allowEdit={allowEdit}
            err={err}
          />
        )}
        {rightChild && rightChild}
      </div>
    </Field>
  );
}
