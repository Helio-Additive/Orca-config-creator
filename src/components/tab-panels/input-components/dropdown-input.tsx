import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

export default function DropdownInput({
  value,
  err,
  inputClassName,
  allowEdit,
  onChange = () => {},
  enumValues,
  idx = 0,
}: {
  value: string;
  err?: string;
  inputClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string, idx?: number) => void;
  enumValues: [string, string][];
  idx?: number;
}) {
  const changeDropdown = (value: string) => {
    if (!allowEdit) return;

    onChange(value, idx);
  };

  return (
    <Menu>
      <MenuButton
        className={twMerge(
          "flex items-center w-fit rounded-lg border-none py-1.5 px-3 text-sm/6",
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
        disabled={!allowEdit}
      >
        {value}
        <FaChevronDown className="ml-2" />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom start"
        className={`w-fit origin-top-left rounded-lg outline-2 -outline-offset-2 outline-text-secondary/20
                text-sm/6 text-text-primary transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] 
                data-[closed]:scale-95 data-[closed]:opacity-0
                mt-1 bg-transparent-black-hover p-1 backdrop-blur-md shadow-lg`}
      >
        {enumValues!.map((enEl) => {
          return (
            <MenuItem key={enEl[1]}>
              <button
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-transparent-black-hover"
                onClick={() => changeDropdown(enEl[1])}
              >
                {enEl[1]}
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
