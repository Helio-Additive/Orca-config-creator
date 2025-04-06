import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useHookstate } from "@hookstate/core";
import { globalState } from "../lib/state-store";
import FileLoader from "./tab-panels/file-loader";
import TabTemplate from "./tab-template";
import VendorConfigTab from "./tab-panels/vendor-config-tab";

export default function TabbedWindow() {
  const { vendorConfigs } = useHookstate(globalState);

  const categories = [
    {
      name: "Load Files",
      component: FileLoader,
      loadCondition: () => true,
    },
    {
      name: "Vendors",
      component: VendorConfigTab,
      loadCondition: () => {
        console.log("some", vendorConfigs.keys.length);
        return vendorConfigs.keys.length > 0;
      },
    },
  ];

  return (
    <div className="flex h-screen w-full max-h-screen max-w-screen justify-start py-10 px-10">
      <div className="w-full h-full">
        <TabGroup className="flex flex-col w-full h-full">
          <TabList className="rounded-xl bg-transparent-base backdrop-blur-xs max-w-fit">
            {categories
              .filter(({ loadCondition }) => {
                return loadCondition();
              })
              .map(({ name }) => {
                return <TabTemplate name={name} key={name} />;
              })}
          </TabList>
          <TabPanels className="flex-1 w-full mt-1 min-h-0">
            {categories
              .filter(({ loadCondition }) => loadCondition())
              .map(({ name, component: Component }) => (
                <TabPanel
                  key={name}
                  className="h-full rounded-xl bg-transparent-base p-3 backdrop-blur-xs overflow-y-auto"
                >
                  <Component />
                </TabPanel>
              ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}
