#[cfg(target_os = "linux")]
use fork::{daemon, Fork};
use std::fs;
use std::path;
use std::path::Path;
use std::process::Command;
#[cfg(target_os = "linux")]
use std::{fs::metadata, path::PathBuf};

use crate::configuration_loader::load_generic_preset; // dep: fork = "0.1"

#[tauri::command]
pub fn check_directory(path: &str) -> bool {
    let path = path::Path::new(path);

    if path.is_dir() {
        true
    } else {
        false
    }
}

#[tauri::command]
pub fn check_file(path: &str) -> bool {
    let path = path::Path::new(path);
    if path.is_file() {
        true
    } else {
        false
    }
}

#[tauri::command]
pub fn show_in_folder(path: String) {
    #[cfg(target_os = "windows")]
    {
        let path = fs::canonicalize(Path::new(&path))
            .unwrap()
            .display()
            .to_string();
        Command::new("explorer")
            .args(["/select,", &path]) // The comma after select is not a typo
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        if path.contains(",") {
            // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
            let new_path = match metadata(&path).unwrap().is_dir() {
                true => path,
                false => {
                    let mut path2 = PathBuf::from(path);
                    path2.pop();
                    path2.into_os_string().into_string().unwrap()
                }
            };
            Command::new("xdg-open").arg(&new_path).spawn().unwrap();
        } else {
            if let Ok(Fork::Child) = daemon(false, false) {
                Command::new("dbus-send")
                    .args([
                        "--session",
                        "--dest=org.freedesktop.FileManager1",
                        "--type=method_call",
                        "/org/freedesktop/FileManager1",
                        "org.freedesktop.FileManager1.ShowItems",
                        format!("array:string:\"file://{path}\"").as_str(),
                        "string:\"\"",
                    ])
                    .spawn()
                    .unwrap();
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open").args(["-R", &path]).spawn().unwrap();
    }
}

#[tauri::command]
pub fn write_to_file(path: String, content: String) -> Result<(), String> {
    let write_res = fs::write(path, content);
    match write_res {
        Ok(()) => Ok(()),
        Err(e) => Err(e.to_string() + "\nYou may need to relaunch the app as administrator"),
    }
}

#[tauri::command]
pub fn rename_file(path: &str, new_path: &str) -> Result<(), String> {
    let renamed_res = fs::rename(path, new_path);
    match renamed_res {
        Ok(()) => Ok(()),
        Err(e) => Err(e.to_string() + "\nYou may need to relaunch the app as administrator"),
    }
}

#[tauri::command]
pub fn rename_config(path: String, new_name: String) -> Result<String, String> {
    let path_obj = Path::new(&path);
    let parent_path = path_obj.parent().unwrap();

    let new_path = parent_path.join(new_name + ".json");
    let new_path_string = new_path.to_str().unwrap().to_string();

    let renamed_res = rename_file(&path, &new_path_string);
    match renamed_res {
        Ok(()) => Ok(new_path_string),
        Err(e) => Err(e),
    }
}
