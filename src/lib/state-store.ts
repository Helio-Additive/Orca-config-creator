import { hookstate } from "@hookstate/core";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";

export type fileProperty = { fileName: string };
export const globalStateObject = {
  orcaInstallationPath: "C:\\Program Files\\OrcaSlicer" as string | undefined,
  orcaDataDirectory: "C:\\Users\\Vipul Rajan\\AppData\\Roaming\\OrcaSlicer" as
    | string
    | undefined,
  errLoadingInstallationPath: undefined as string | undefined,
  errLoadingDataPath: undefined as string | undefined,
  os: "none",
  vendorConfigs: {} as Record<string, VendorJsonSchema>,
  modelConfigs: {} as Record<
    string,
    { Ok?: MinPrinterModelJsonSchema; Err?: string } & { fileName: string }
  >,
  installedPrinterConfigs: {} as Record<
    string,
    Record<
      string,
      { Ok?: MinPrinterVariantJsonSchema; Err?: string } & { fileName: string }
    >
  >,
  instantiatedInstalledPrinterConfigs: {} as Record<
    string,
    MinPrinterVariantJsonSchema & fileProperty
  >,
  loadedSystemPrinterConfigs: {} as Record<
    string,
    Record<
      string,
      { Ok?: MinPrinterVariantJsonSchema; Err?: string } & { fileName: string }
    >
  >,
  loadedUserPrinterConfigs: {} as Record<
    string,
    MinPrinterVariantJsonSchema & { fileName: string }
  >,
};

export const globalState = hookstate(globalStateObject);
