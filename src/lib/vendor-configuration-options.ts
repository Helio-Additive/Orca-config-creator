import { ConfigOptionType } from "./config-option-types";
import { ConfigProperty } from "./printer-configuration-options";

// prettier-ignore
export const vendor_model_properties: ConfigProperty[] = [
{ id: "name", type: ConfigOptionType.coString, fixed: false, requiredInUser: true, requiredInInstalled: true, notPossibleToInherit: true, label: "Printer name", tooltip: "Name of the printer", default: "", regex:/^[^><[\]:\\/|?*]+$/, regexWarning: "Name cannot contain these characters <>[]/:|?*", regexWarningType: "error"},
{ id: "version", type: ConfigOptionType.coString, fixed: false, requiredInUser: true, requiredInInstalled: true, notPossibleToInherit: false, label: "Version", tooltip: "Version of the preset", default: "", regex: /^(?:[^.]*\.){1,3}[^.]*$/, regexWarning: "Version does not meet the required pattern: A.B.C.D", regexWarningType: "error"},
{ id: "description", type: ConfigOptionType.coString, fixed: false,  label: "Description", default: ""},
{ id: "force_update", type: ConfigOptionType.coBool, fixed: false, requiredInUser: false, label: "Force update", tooltip: "Should force update if the config has been updated", default: true},
{ id: "machine_model_list", type: ConfigOptionType.coNameAndSubpaths, fixed: false, label: "Printer model list", tooltip: "Names and subpaths of printer model configs", default: [{name:"", sub_path: ""}]},
{ id: "process_list", type: ConfigOptionType.coNameAndSubpaths, fixed: false, label: "Process list", tooltip: "Should force update if the config has been updated", default: [{name:"", sub_path: ""}]},
{ id: "filament_list", type: ConfigOptionType.coNameAndSubpaths, fixed: false, label: "Filament list", tooltip: "Should force update if the config has been updated", default: [{name:"", sub_path: ""}]},
{ id: "machine_list", type: ConfigOptionType.coNameAndSubpaths, fixed: false, label: "Printer list", tooltip: "Should force update if the config has been updated", default: [{name:"", sub_path: ""}]},
]

export const vendor_model_properties_map = vendor_model_properties.reduce(
  (acc, el) => {
    acc[el.id] = el;
    return acc;
  },
  {} as Record<string, ConfigProperty>
);
