import { Input } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export default function ValueInput({
  type = "text",
  value,
  placeholder,
  onClick,
  err,
  inputClassName,
  allowEdit,
  onChange = () => {},
}: {
  type?: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  err?: string;
  inputClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string) => void;
}) {
  const changeFunction = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;

    onChange(e.target.value);
  };

  return (
    <Input
      placeholder={placeholder}
      value={value ?? placeholder}
      className={twMerge(
        "w-full flex-3/4 rounded-lg border-none py-1.5 px-3 text-sm/6",
        "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
        err ? "bg-transparent-error" : "bg-transparent-white-input",
        allowEdit
          ? value
            ? "text-text-primary"
            : "text-text-secondary"
          : "text-text-secondary",
        "mr-1",
        inputClassName
      )}
      onClick={onClick}
      onChange={changeFunction}
      type={type}
      disabled={!allowEdit}
    />
  );
}
