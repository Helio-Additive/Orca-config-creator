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
    <div className="flex h-screen w-full justify-start py-10 px-10 overflow-y-scroll">
      <div className="w-full">
        <TabGroup>
          <TabList className="flex rounded-xl bg-transparent-base backdrop-blur-xs max-w-fit">
            {categories
              .filter(({ loadCondition }) => {
                return loadCondition();
              })
              .map(({ name }) => {
                return <TabTemplate name={name} key={name} />;
              })}
          </TabList>
          <TabPanels className="mt-1">
            {categories
              .filter(({ loadCondition }) => loadCondition())
              .map(({ name, component: Component }) => (
                <TabPanel
                  key={name}
                  className="rounded-xl bg-transparent-base p-3 backdrop-blur-xs"
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
