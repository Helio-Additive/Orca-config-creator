# Understanding OrcaSlicer Config System

### The doc is written for OrcaSlicer but about 90% of it is applicable as it is to BambuStudio and PrusaSlicer

- ### [Config Types](docs/config-types.md)

- ### [Installed, loaded and user configs](docs/config-locations.md)

# How to load configurations into the configuration manager

When you first open the config manager you will be greeted with this screen.
![File Loader Tab](docs/images/file_loader_tab.png)

[**Orca Installation Directory**](docs/config-locations.md#installed): this is the path where OrcaSlicer is installed. For windows it is the path in `Program Files`. For Mac OS, it is the Application Package.

#### Defaults

**Windows**: C:/Program Files/OrcaSlicer <br>
**MacOS**: /AppData/Roaming/OrcaSlicer.app <br>
**Linux**: Those nerds can figure it out themselves

These defaults will be loaded automatically when you open the app. If the installation folder has been changed, you will have to manually set it.

[**Orca Data Directory**](docs/config-locations.md#loaded): This is the path where OrcaSlicer stores configuration data. You can open it by launching orca slicer and finding this option:
![orca configuration folder](docs/images/how_to_open_config_directory.png)

The default for this will also be automatically loaded on launch. You only need to set it if a non default folder has been set for configurations.

# Config Operations

<img src="docs/images/edit_config_icon.svg" alt="My SVG" width="20">: Edit config
