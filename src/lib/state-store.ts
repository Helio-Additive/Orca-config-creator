import { hookstate } from "@hookstate/core";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";
import { MinFilamentJsonSchema } from "./bindings/MinFilamentJsonSchema";
import { MinProcessJsonSchema } from "./bindings/MinProcessJsonSchema";
import { ConfigType } from "./commons";

export type fileProperty = { fileName: string };
export type familyProperty = { family: string };

export const globalStateObject = {
  orcaInstallationPath: undefined as string | undefined,
  orcaDataDirectory: undefined as string | undefined,
  errLoadingInstallationPath: undefined as string | undefined,
  errLoadingDataPath: undefined as string | undefined,
  os: "none",
  vendorConfigs: {} as Record<string, VendorJsonSchema & fileProperty>,
  modelConfigs: {} as Record<
    string,
    { Ok?: MinPrinterModelJsonSchema; Err?: string } & fileProperty
  >,
  installedPrinterConfigs: {} as Record<
    string,
    Record<
      string,
      { Ok?: MinPrinterVariantJsonSchema; Err?: string } & fileProperty
    >
  >,
  installedFilamentConfigs: {} as Record<
    string,
    Record<string, { Ok?: MinFilamentJsonSchema; Err?: string } & fileProperty>
  >,
  installedProcessConfigs: {} as Record<
    string,
    Record<string, { Ok?: MinProcessJsonSchema; Err?: string } & fileProperty>
  >,
  instantiatedInstalledPrinterConfigs: {} as Record<
    string,
    MinPrinterVariantJsonSchema & fileProperty & familyProperty
  >,
  instantiatedInstalledFilamentConfigs: {} as Record<
    string,
    MinFilamentJsonSchema & fileProperty & familyProperty
  >,
  instantiatedInstalledProcessConfigs: {} as Record<
    string,
    MinProcessJsonSchema & fileProperty & familyProperty
  >,
  loadedSystemPrinterConfigs: {} as Record<
    string,
    Record<
      string,
      { Ok?: MinPrinterVariantJsonSchema; Err?: string } & fileProperty
    >
  >,
  loadedSystemFilamentConfigs: {} as Record<
    string,
    Record<string, { Ok?: MinFilamentJsonSchema; Err?: string } & fileProperty>
  >,
  loadedSystemProcessConfigs: {} as Record<
    string,
    Record<string, { Ok?: MinProcessJsonSchema; Err?: string } & fileProperty>
  >,
  loadedUserPrinterConfigs: {} as Record<
    string,
    MinPrinterVariantJsonSchema & fileProperty
  >,
  loadedUserFilamentConfigs: {} as Record<
    string,
    MinFilamentJsonSchema & fileProperty
  >,
  loadedUserProcessConfigs: {} as Record<
    string,
    MinProcessJsonSchema & fileProperty
  >,
  editWindowState: {} as Record<
    string,
    {
      fileName: string;
      type: ConfigType;
      name: string;
      family?: string;
      properties: {
        res: Record<string, unknown>;
        keyDetails: Record<
          string,
          [string, number, string | undefined, string]
        >;
      };
      changedProps: Record<string, unknown>;
      knownKeys: string[];
      unknownKeys: string[];
    }
  >,
  routeStack: [] as string[],
  selectedTab: 0,
};

export const globalState = hookstate(globalStateObject);
