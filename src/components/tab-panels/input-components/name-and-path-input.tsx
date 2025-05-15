import { Input } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { ConfigNameAndPath } from "../../../lib/bindings/ConfigNameAndPath";

export default function NameAndPathInput({
  type = "text",
  value,
  placeholder,
  onClick,
  err,
  inputClassName,
  allowEdit,
  onChange = () => {},
  idx,
}: {
  type?: string;
  value?: ConfigNameAndPath;
  placeholder?: string;
  onClick?: () => void;
  err?: string;
  inputClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: ConfigNameAndPath, idx?: number) => void;
  idx?: number;
}) {
  const onNameChangeFunction = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;

    const newValue = {
      ...(value ?? { name: "", sub_path: "" }),
      name: e.target.value,
    };
    onChange(newValue, idx);
  };

  const onSubPathChangeFunction = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEdit) return;

    const newValue = {
      ...(value ?? { name: "", sub_path: "" }),
      sub_path: e.target.value,
    };
    onChange(newValue, idx);
  };

  return (
    <div className="flex w-full">
      <Input
        placeholder={placeholder}
        value={value?.name}
        className={twMerge(
          "w-full mr-1 min-w-fit flex-3/4 rounded-lg border-none py-1.5 px-3 text-sm/6",
          "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
          err ? "bg-transparent-error" : "bg-transparent-white-input",
          allowEdit
            ? value
              ? "text-text-primary"
              : "text-text-secondary"
            : "text-text-secondary",
          inputClassName
        )}
        onClick={onClick}
        onChange={onNameChangeFunction}
        type={type}
        disabled={!allowEdit}
      />

      <Input
        placeholder={placeholder}
        value={value?.sub_path}
        className={twMerge(
          "w-full min-w-fit flex-3/4 rounded-lg border-none py-1.5 px-3 text-sm/6",
          "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
          err ? "bg-transparent-error" : "bg-transparent-white-input",
          allowEdit
            ? value
              ? "text-text-primary"
              : "text-text-secondary"
            : "text-text-secondary",
          inputClassName
        )}
        onClick={onClick}
        onChange={onSubPathChangeFunction}
        type={type}
        disabled={!allowEdit}
      />
    </div>
  );
}
