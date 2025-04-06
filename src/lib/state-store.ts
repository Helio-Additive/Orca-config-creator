import { hookstate } from "@hookstate/core";
import { VendorJsonSchema } from "./bindings/VendorJsonSchema";

const globalStateObject = {
  orcaInstallationPath: undefined as string | undefined,
  orcaDataDirectory: undefined as string | undefined,
  vendorConfigs: {} as Record<string, VendorJsonSchema>,
};

export const globalState = hookstate(globalStateObject);
