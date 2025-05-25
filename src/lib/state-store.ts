import { hookstate } from "@hookstate/core";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";
import { MinFilamentJsonSchema } from "./bindings/MinFilamentJsonSchema";
import { MinProcessJsonSchema } from "./bindings/MinProcessJsonSchema";
import { ConfigLocationType, ConfigType } from "./commons";

export type fileProperty = { fileName: string };
export type familyProperty = { family: string };
export type KeyDetails = {
  configName: string;
  level: number;
  family?: string;
  file: string;
};

export type Warning = {
  text: string;
  type: "warning" | "error" | "critical";
};

export type SystemConfigStateType<T> = Record<
  string,
  Record<string, { Ok?: T; Err?: string } & fileProperty>
>;

export type InstantiatedConfigStateType<T> = Record<
  string,
  T & fileProperty & familyProperty
>;

export type NamedConfigStateType<T> = Record<string, T & fileProperty>;

export const globalStateObject = {
  orcaInstallationPath: undefined as string | undefined,
  orcaDataDirectory: undefined as string | undefined,
  errLoadingInstallationPath: undefined as string | undefined,
  errLoadingDataPath: undefined as string | undefined,
  os: "none",
  installedVendorConfigs: {} as NamedConfigStateType<VendorJsonSchema>,
  installedModelConfigs: {} as SystemConfigStateType<MinPrinterModelJsonSchema>,
  installedPrinterConfigs:
    {} as SystemConfigStateType<MinPrinterVariantJsonSchema>,
  installedFilamentConfigs: {} as SystemConfigStateType<MinFilamentJsonSchema>,
  installedProcessConfigs: {} as SystemConfigStateType<MinProcessJsonSchema>,
  instantiatedInstalledPrinterConfigs:
    {} as InstantiatedConfigStateType<MinPrinterVariantJsonSchema>,
  instantiatedInstalledFilamentConfigs:
    {} as InstantiatedConfigStateType<MinFilamentJsonSchema>,
  instantiatedInstalledProcessConfigs:
    {} as InstantiatedConfigStateType<MinProcessJsonSchema>,
  loadedSystemVendorConfigs: {} as NamedConfigStateType<VendorJsonSchema>,
  loadedSystemModelConfigs:
    {} as SystemConfigStateType<MinPrinterModelJsonSchema>,
  loadedSystemPrinterConfigs:
    {} as SystemConfigStateType<MinPrinterVariantJsonSchema>,
  loadedSystemFilamentConfigs:
    {} as SystemConfigStateType<MinFilamentJsonSchema>,
  loadedSystemProcessConfigs: {} as SystemConfigStateType<MinProcessJsonSchema>,
  loadedUserPrinterConfigs:
    {} as NamedConfigStateType<MinPrinterVariantJsonSchema>,
  loadedUserFilamentConfigs: {} as NamedConfigStateType<MinFilamentJsonSchema>,
  loadedUserProcessConfigs: {} as NamedConfigStateType<MinProcessJsonSchema>,
  editWindowState: {} as Record<
    string,
    {
      fileName: string;
      type: ConfigType;
      name: string;
      family?: string;
      location: ConfigLocationType;
      properties: {
        res: Record<string, unknown>;
        keyDetails: Record<string, KeyDetails>;
        warnings: Record<string, Warning[]>;
      };
      changedProps: Record<string, unknown>;
      deleteKeys: string[];
      knownKeys: Set<string>;
      unknownKeys: Set<string>;
    }
  >,
  routeStack: [] as string[],
  selectedTab: 0,
};

export const globalState = hookstate(globalStateObject);

export const appStateObject = {
  itemVisibilityState: {
    printer: { installed: 30, loadedSystem: 30, user: 30 },
    filament: { installed: 30, loadedSystem: 30, user: 30 },
    process: { installed: 30, loadedSystem: 30, user: 30 },
    model: { installed: 30, loadedSystem: 30, user: 30 },
    vendor: { installed: 30, loadedSystem: 30, user: 30 },
  },
};

export const appState = hookstate(structuredClone(appStateObject));
