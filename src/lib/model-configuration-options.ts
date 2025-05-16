import { ConfigOptionType } from "./config-option-types";
import { ConfigProperty } from "./printer-configuration-options";

// prettier-ignore
export const printer_model_properties: ConfigProperty[] = [
{ id: "name", type: ConfigOptionType.coString, fixed: false, requiredInUser: true, requiredInInstalled: true, notPossibleToInherit: true, label: "Printer name", tooltip: "Name of the printer", default: "", regex:/^[^><[\]:\\/|?*]+$/, regexWarning: "Name cannot contain these characters <>[]/:|?*", regexWarningType: "error"},
{ id: "type", type: ConfigOptionType.coString, fixed: true, requiredInUser: true, requiredInInstalled: true, label: "Preset type", tooltip: "Type of the preset", default: ""},
{ id: "version", type: ConfigOptionType.coString, fixed: false, requiredInUser: true, requiredInInstalled: false, notPossibleToInherit: false, label: "Version", tooltip: "Version of the preset", default: "", regex: /^(?:[^.]*\.){1,3}[^.]*$/, regexWarning: "Version does not meet the required pattern: A.B.C.D", regexWarningType: "error"},
{ id: "url", type: ConfigOptionType.coString, fixed: false,  label: "URL", tooltip: "It does nothing at all. Probably future proofing", default: ""},
{ id: "model_id", type: ConfigOptionType.coString, fixed: false,  label: "Model ID", tooltip: "Not required and is unclear what it does", default: ""},
{ id: "nozzle_diameter", type: ConfigOptionType.coString, fixed: false, requiredInUser: true, requiredInInstalled: true, label: "Nozzle diameter", tooltip: "Diameters of nozzles of the printers. 'printer_variant' in the Printer configuration should point to this", default: "", delimiter:";"},
{ id: "family", type: ConfigOptionType.coString, fixed: false,  label: "Family", tooltip: "Family the model config belongs to. Ideally should be the same as the directory it is in but not necessarily", default: ""},
{ id: "machine_tech", type: ConfigOptionType.coEnum, fixed: true, label: "Printer technology", tooltip: "Printer technology", enumList: [["FFF", "FFF"]], default: "FFF"},
{ id: "bed_model", type: ConfigOptionType.coString, fixed: false,  label: "Bed model", tooltip: "Filename of the bed model (STL). File should exist in the vendor directory", default: "", search: "stl"},
{ id: "bed_texture", type: ConfigOptionType.coString, fixed: false,  label: "Bed texture", tooltip: "Filename of the bed texture (SVG). File should exist in the vendor directory", default: "", search: "svg"},
{ id: "hotend_model", type: ConfigOptionType.coString, fixed: false,  label: "Hotend model", tooltip: "Filename of the hotend model (STL). File should exist in the vendor directory", default: "", search: "stl"},
{ id: "default_materials", type: ConfigOptionType.coString, fixed: false,  label: "Default Materials", tooltip: "Default materials for the printers", default: "", delimiter:";", search: "filament"}
]

export const printer_model_properties_map = printer_model_properties.reduce(
  (acc, el) => {
    acc[el.id] = el;
    return acc;
  },
  {} as Record<string, ConfigProperty>
);
