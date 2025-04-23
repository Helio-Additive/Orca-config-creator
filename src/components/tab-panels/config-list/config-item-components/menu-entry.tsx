import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export default function MenuEntry({
  Icon,
  text,
  className,
  onClick,
}: {
  Icon: (a: { className?: string }) => ReactNode;
  text: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={twMerge(
        "hover:text-text-secondary hover:scale-95 w-6 h-6 active:scale-85 min-w-fit",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <Icon className="mr-1" />
        <div className="whitespace-nowrap">{text}</div>
      </div>
    </button>
  );
}
