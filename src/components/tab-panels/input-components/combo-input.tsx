import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

export default function ComboInput({
  value,
  err,
  inputClassName,
  allowEdit,
  onChange = () => {},
  possibleValues,
  idx,
  placeholder,
}: {
  value?: string;
  err?: string;
  inputClassName?: string;
  allowEdit?: boolean;
  onChange?: (value: string, idx?: number) => void;
  possibleValues: string[];
  idx?: number;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filteredValues = (
    query === ""
      ? possibleValues
      : possibleValues.filter((el) => {
          return el.toLowerCase().includes(query.toLowerCase()) && el;
        })
  ).slice(0, 100);

  const changeFunction = (e: string) => {
    if (!allowEdit) return;

    onChange(e, idx);
  };

  return (
    <Combobox
      value={value}
      onChange={changeFunction}
      onClose={() => setQuery("")}
      disabled={!allowEdit}
    >
      <ComboboxInput
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
        displayValue={(el) => el as string}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
      />
      <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
        <FaChevronDown className="size-4 fill-white/60 group-data-hover:fill-white" />
      </ComboboxButton>

      <ComboboxOptions
        anchor="bottom"
        transition
        className={`w-(--input-width) origin-top-left rounded-lg outline-2 -outline-offset-2 outline-text-secondary/20
                text-sm/6 text-text-primary transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] 
                data-[closed]:scale-95 data-[closed]:opacity-0 z-20
                mt-1 bg-transparent-black-hover p-1 backdrop-blur-md shadow-lg pointer-events-auto`}
      >
        {query.length > 0 && !filteredValues.includes(query) && (
          <ComboboxOption
            value={query}
            className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-focus:bg-transparent-black-hover"
          >
            New Value: {query}
          </ComboboxOption>
        )}
        {filteredValues.map((el) => (
          <ComboboxOption
            key={el}
            value={el}
            className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-focus:bg-transparent-black-hover"
          >
            {el}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
