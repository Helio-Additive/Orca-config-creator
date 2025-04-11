export const INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY =
  "/resources/profiles";
export const INSTALLED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY_MACOS =
  "/Contents/Resources/profiles";
export const LOADED_SYSTEM_PROFILES_SUBDIRECTORY_DIRECTORY = "/system";
export const LOADED_USER_PROFILES_SUBDIRECTORY_DIRECTORY = "/user/default";
export const LOADED_USER_PROFILES_BASE_SUBDIRECTORY_DIRECTORY = "/base";
export const LOADED_USER_PROFILES_MACHINE_SUBDIRECTORY_DIRECTORY = "/machine";

export const directoryDefaults = {
  win32: {
    installationDirectory: "C:/Program Files/OrcaSlicer",
    dataSubdirectory: "/AppData/Roaming/OrcaSlicer",
  },
  darwin: {
    installationDirectory: "Applications/OrcaSlicer.app",
    dataSubdirectory: "/Library/Application Support/OrcaSlicer",
  },
};
