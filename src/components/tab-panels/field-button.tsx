import { Button } from "@headlessui/react";
import clsx from "clsx";

export default function FieldButton({
  onClick,
  text,
}: {
  text: string;
  onClick?: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={clsx(
        "rounded-lg border-none bg-transparent-white-input py-1.5 px-3 text-sm/6 text-white",
        "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
        "data-[hover]:bg-transparent-black-hover",
        "flex-1/4"
      )}
    >
      {text}
    </Button>
  );
}
