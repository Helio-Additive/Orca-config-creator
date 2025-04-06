import { hookstate } from "@hookstate/core";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";
import { PrinterModelJsonSchema } from "./bindings/PrinterModelJsonSchema";
import { PrinterVariantJsonSchema } from "./bindings/PrinterVariantJsonSchema";
import { MinPrinterModelJsonSchema } from "./bindings/MinPrinterModelJsonSchema";
import { MinPrinterVariantJsonSchema } from "./bindings/MinPrinterVariantJsonSchema";

const globalStateObject = {
  orcaInstallationPath: undefined as string | undefined,
  orcaDataDirectory: undefined as string | undefined,
  vendorConfigs: {} as Record<string, VendorJsonSchema>,
  modelConfigs: {} as Record<
    string,
    { Ok?: MinPrinterModelJsonSchema; Err?: string } & { fileName: string }
  >,
  printerConfigs: {} as Record<
    string,
    { Ok?: MinPrinterVariantJsonSchema; Err?: string } & { fileName: string }
  >,
};

export const globalState = hookstate(globalStateObject);
