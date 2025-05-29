import { Dialog } from "radix-ui";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function InputPopover({
  popoverVisible,
  setPopOverVisible,
  label,
  description,
  inputChildren,
  onCancel = () => {},
  onSubmit = () => {},
}: {
  popoverVisible: boolean;
  setPopOverVisible: (a: boolean) => void;
  label?: string;
  description?: string;
  inputChildren?: ReactNode[];
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  return (
    <Dialog.Root open={popoverVisible} onOpenChange={setPopOverVisible}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={twMerge(
            "fixed top-1/2 left-1/2 max-w-md w-full -translate-x-1/2 -translate-y-1/2 bg-transparent-white-input rounded-xl p-2 pl-3 pr-4 text-text-primary",
            "shadow-md shadow-transparent-black-hover backdrop-blur-lg",
            "outline-2 -outline-offset-2 outline-text-secondary/20"
          )}
        >
          {label && (
            <Dialog.Title className="text-lg font-medium">{label}</Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              {description}
            </Dialog.Description>
          )}

          {inputChildren}

          <div className="mt-6 flex justify-end space-x-2">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 rounded bg-transparent-base hover:bg-transparent-black-hover"
                onClick={() => {
                  setPopOverVisible(false);
                  onCancel();
                }}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              className="px-4 py-2 rounded bg-accent text-text-primary hover:bg-transparent-black-hover"
              onClick={async () => {
                setPopOverVisible(false);
                onSubmit();
              }}
            >
              Submit
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
