import { Tooltip } from "radix-ui";
import { twMerge } from "tailwind-merge";
import Infotip from "../../../tooltip/infotip";
import { ReactNode } from "react";

export default function TopButton({
  Icon,
  onClick,
  className,
  tooltip,
}: {
  className?: string;
  Icon: (a: { className?: string }) => ReactNode;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <Tooltip.Root delayDuration={800}>
      <Tooltip.Trigger asChild>
        <div
          onClick={onClick}
          className={twMerge(
            "hover:text-text-secondary hover:scale-95 w-6 h-6 active:scale-85",
            className
          )}
        >
          <Icon className="w-full h-full" />
        </div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Content>
          <Infotip tooltip={tooltip} />
        </Tooltip.Content>
      )}
    </Tooltip.Root>
  );
}
