import { invoke } from "@tauri-apps/api/tauri";

export const checkPathExists = async (path: string) => {
  return await invoke("check_directory", { path: path });
};
