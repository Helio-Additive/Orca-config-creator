import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useHookstate } from "@hookstate/core";
import { globalState } from "../lib/state-store";
import FileLoader from "./tab-panels/file-loader";
import TabTemplate from "./tab-template";
import VendorConfigTab from "./tab-panels/vendor-config-tab";
import ModelConfigTab from "./tab-panels/model-config-tab";
import PrinterConfigTab from "./tab-panels/printer-config-tab";
import FilamentConfigTab from "./tab-panels/filament-config-tab";
import ProcessConfigTab from "./tab-panels/process-config-tab";

export default function TabbedWindow() {
  const { orcaInstallationPath, orcaDataDirectory } = useHookstate(globalState);

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
        return orcaInstallationPath.get() !== undefined;
      },
    },
    {
      name: "Models",
      component: ModelConfigTab,
      loadCondition: () => {
        return orcaInstallationPath.get() !== undefined;
      },
    },
    {
      name: "Printers",
      component: PrinterConfigTab,
      loadCondition: () => {
        return (
          orcaInstallationPath.get() !== undefined ||
          orcaDataDirectory.get() !== undefined
        );
      },
    },
    {
      name: "Filaments",
      component: FilamentConfigTab,
      loadCondition: () => {
        return (
          orcaInstallationPath.get() !== undefined ||
          orcaDataDirectory.get() !== undefined
        );
      },
    },
    {
      name: "Processes",
      component: ProcessConfigTab,
      loadCondition: () => {
        return (
          orcaInstallationPath.get() !== undefined ||
          orcaDataDirectory.get() !== undefined
        );
      },
    },
  ];

  return (
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
      <TabPanels className="w-full mt-1 min-h-0">
        {categories
          .filter(({ loadCondition }) => loadCondition())
          .map(({ name, component: Component }) => (
            <TabPanel
              key={name}
              className="h-full rounded-xl bg-transparent-base p-3 backdrop-blur-xs"
            >
              <Component />
            </TabPanel>
          ))}
      </TabPanels>
    </TabGroup>
  );
}
