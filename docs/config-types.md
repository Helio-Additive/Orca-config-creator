# Config Types

There are 5 different config types in OrcaSlicer:

## Vendor Config

These are configuration bundles that contain all other configs. Each vendor config is a json file and has a corresponding directory in the [installation path](config-locations#installed). The json file contains the paths to all other types of configuration in the corresponding directory. Which contain the remain 4 types of configs.

## Printer Model Config

Every [printer variant config](#printer-variant-config) must have a printer model config. Each model refers to variants by different nozzle sizes.

## Printer Variant Config

These are the main printer configs that contain all the printer settings. Each one must correspond to a printer model

## Filament Config

These are, as the name suggests, the configurations for filaments. Each one has a few compatible printers and is shown only for those printers

## Process/Print configs

These are the process configs that are shown for each printer. Just like the filaments, these two should have compatible printers.
