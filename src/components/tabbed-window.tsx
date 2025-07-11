import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useHookstate } from "@hookstate/core";
import { PiBroomLight } from "react-icons/pi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { analyseConfigs, deleteConfig, refreshConfigs } from "../lib/commons";
import { appState, globalState } from "../lib/state-store";
import AnalysisTab from "./tab-panels/analysis-tab";
import TopButton from "./tab-panels/config-list/config-item-components/top-button";
import FilamentConfigTab from "./tab-panels/filament-config-tab";
import FileLoader from "./tab-panels/file-loader";
import InputComponent from "./tab-panels/input-component";
import ModelConfigTab from "./tab-panels/model-config-tab";
import PrinterConfigTab from "./tab-panels/printer-config-tab";
import ProcessConfigTab from "./tab-panels/process-config-tab";
import VendorConfigTab from "./tab-panels/vendor-config-tab";
import TabTemplate from "./tab-template";
import { BiSolidAnalyse } from "react-icons/bi";

export default function TabbedWindow() {
  const {
    orcaInstallationPath,
    orcaDataDirectory,
    selectedTab,
    analysisErrors,
    analysisWarnings,
  } = useHookstate(globalState);

  const { searchQuery, selectedConfigs, selectedConfigType, analysisGoingOn } =
    useHookstate(appState);

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
    {
      name: "Analysis",
      component: AnalysisTab,
      loadCondition: () =>
        analysisErrors.keys.length > 0 || analysisWarnings.keys.length > 0,
    },
  ];

  return (
    <TabGroup
      className="flex flex-col w-full h-full"
      selectedIndex={selectedTab.get()}
      onChange={selectedTab.set}
    >
      <div className="flex w-full">
        <TabList className="rounded-xl bg-transparent-base backdrop-blur-lg max-w-fit">
          {categories
            .filter(({ loadCondition }) => {
              return loadCondition();
            })
            .map(({ name }) => {
              return <TabTemplate name={name} key={name} />;
            })}
        </TabList>
        <div className="h-full flex rounded-xl bg-transparent-base backdrop-blur-lg max-w-fit ml-1 items-center pl-2 pr-1">
          <InputComponent
            type="text"
            placeholder="Search"
            className="mb-0"
            value={searchQuery.get()}
            onChange={(a) => searchQuery.set(a as string)}
            allowEdit
          />
        </div>
        {selectedConfigs.get().size && (
          <>
            <TopButton
              className="text-text-primary h-full ml-1"
              onClick={() => {
                selectedConfigs.set(new Set());
              }}
              Icon={PiBroomLight}
              tooltip="Clear Selection"
            />

            <TopButton
              className="text-text-primary h-full ml-1"
              onClick={async () => {
                const selectedConfigsArray = Array.from(
                  selectedConfigs.get({ stealth: true })
                );

                for (let i = 0; i < selectedConfigsArray.length; i++) {
                  const el = selectedConfigsArray[i];
                  const parsedEl = JSON.parse(el);
                  await deleteConfig(
                    parsedEl.configName,
                    parsedEl.type,
                    parsedEl.location,
                    parsedEl.family,
                    true
                  );
                }
                refreshConfigs(
                  selectedConfigType.get({ stealth: true })!,
                  "installed"
                );
                selectedConfigs.set(new Set());
              }}
              Icon={RiDeleteBin6Line}
              tooltip="Delete Selected"
            />
          </>
        )}
        {!analysisGoingOn.get({ stealth: true }) && (
          <TopButton
            className="text-text-primary h-full ml-1"
            onClick={async () => {
              analysisGoingOn.set(true);
              await analyseConfigs();
              analysisGoingOn.set(false);
            }}
            Icon={BiSolidAnalyse}
            tooltip="Analyse Configs"
          />
        )}
      </div>
      <TabPanels className="w-full mt-1 min-h-0">
        {categories
          .filter(({ loadCondition }) => loadCondition())
          .map(({ name, component: Component }) => (
            <TabPanel
              key={name}
              className="h-full rounded-xl bg-transparent-base p-3 backdrop-blur-lg"
            >
              <Component />
            </TabPanel>
          ))}
      </TabPanels>
    </TabGroup>
  );
}
