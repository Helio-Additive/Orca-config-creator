import { Field, Input, Label } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

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
        <Input
          placeholder={placeholder}
          value={value ?? placeholder}
          className={twMerge(
            "w-full flex-3/4 rounded-lg border-none py-1.5 px-3 text-sm/6",
            "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
            err ? "bg-transparent-error" : "bg-transparent-white-input",
            value ? "text-text-primary" : "text-text-secondary",
            "mr-1",
            inputClassName
          )}
          onClick={onClick}
          type={type}
        />
        {rightChild && rightChild}
      </div>
    </Field>
  );
}
