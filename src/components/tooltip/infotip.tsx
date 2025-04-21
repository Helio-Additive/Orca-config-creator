import { twMerge } from "tailwind-merge";

export default function Infotip({
  tooltip,
  className,
}: {
  tooltip: string;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "p-1 px-3 bg-accent rounded-sm backdrop-blur-lg",
        "text-text-primary font-medium z-30",
        className
      )}
    >
      {tooltip}
    </div>
  );
}
