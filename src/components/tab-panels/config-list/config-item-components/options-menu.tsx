import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ReactNode } from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import { twMerge } from "tailwind-merge";
import MenuEntry from "./menu-entry";
import TopButton from "./top-button";

export default function OptionsMenu({
  menuItems,
}: {
  menuItems: {
    icon: (a: { className?: string }) => ReactNode;
    text: string;
    onClick: () => void;
  }[];
}) {
  return (
    <Menu>
      <MenuButton>
        <TopButton
          onClick={console.log}
          Icon={HiDotsHorizontal}
          className="ml-1"
        />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className={twMerge(
          "flex flex-col justify-center bg-transparent-white-input rounded-xl p-2 pl-2 pr-4 text-text-primary",
          "shadow-md shadow-transparent-black-hover",
          "outline-2 -outline-offset-2 outline-text-secondary/20"
        )}
      >
        {menuItems.map((el) => (
          <MenuItem key={el.text}>
            <MenuEntry Icon={el.icon} text={el.text} onClick={el.onClick} />
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
