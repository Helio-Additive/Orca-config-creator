import { Button } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export default function FieldButton({
  onClick,
  text,
  className,
  disabled,
}: {
  text: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      className={twMerge(
        "rounded-lg border-none bg-transparent-white-input py-1.5 px-3 text-sm/6 text-white",
        "shadow-md shadow-transparent-black-hover hover::outline-none data-[hover]:outline-2 data-[hover]:-outline-offset-2 data-[hover]:outline-text-secondary",
        "data-[hover]:bg-transparent-black-hover",
        "flex-1/4",
        "disabled:text-text-secondary disabled:bg-transparent",
        className
      )}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}
