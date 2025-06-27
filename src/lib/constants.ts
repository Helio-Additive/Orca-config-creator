export const INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY = "/resources/profiles";
export const INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_MACOS =
  "/Contents/Resources/profiles";
export const LOADED_SYSTEM_PROFILES_SUBDIRECTORY = "/system";
export const LOADED_USER_PROFILES_SUBDIRECTORY = "/user/default";
export const LOADED_USER_PROFILES_BASE_SUBDIRECTORY = "/base";
export const MACHINE_SUBDIRECTORY = "/machine";
export const FILAMENT_SUBDIRECTORY = "/filament";
export const PROCESS_SUBDIRECTORY = "/process";

export const directoryDefaults = {
  win32: {
    installationDirectory: "C:/Program Files/OrcaSlicer",
    dataSubdirectory: "/AppData/Roaming/OrcaSlicer",
  },
  darwin: {
    installationDirectory: "/Applications/OrcaSlicer.app",
    dataSubdirectory: "/Library/Application Support/OrcaSlicer",
  },
};

export const NEW_FILE_FILE_NAME_PLACEHOLDER = "newFile";
