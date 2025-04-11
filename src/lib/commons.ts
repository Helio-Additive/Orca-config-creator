import { invoke } from "@tauri-apps/api/tauri";

export const checkDirectoryExists = async (path: string) => {
  return await invoke("check_directory", { path: path });
};

export const checkFileExists = async (path: string) => {
  console.log(path);
  return await invoke("check_file", { path: path });
};
