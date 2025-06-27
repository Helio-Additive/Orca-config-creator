import { Tab } from "@headlessui/react";

export default function TabTemplate({ name }: { name: string }) {
  return (
    <Tab
      key={name}
      className={`rounded-xl
                    py-0.5 pb-1.5 px-6 text-2xl m-1
                    font-semibold text-text-secondary focus:outline-none 
                    data-[hover]:text-text-primary
                    data-[selected]:text-text-primary
                    data-[selected]:bg-transparent-black-selected
                    data-[hover]:bg-transparent-black-hover
                    data-[focus]:outline-1 
                    data-[focus]:outline-white`}
    >
      {name}
    </Tab>
  );
}
