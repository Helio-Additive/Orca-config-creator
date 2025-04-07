import { hookstate } from "@hookstate/core";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";

export const globalStateObject = {
  orcaInstallationPath: undefined as string | undefined,
  orcaDataDirectory: undefined as string | undefined,
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
};

export const globalState = hookstate(globalStateObject);
