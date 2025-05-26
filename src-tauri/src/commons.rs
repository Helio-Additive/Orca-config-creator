#[cfg(target_os = "linux")]
use fork::{daemon, Fork};
use fs_extra::dir;
use fs_extra::file;
use serde_json::Value;
use std::ffi::OsString;
use std::fs;
use std::fs::File;
use std::path::Path;
use std::path::{self, PathBuf};
use std::process::Command;
use std::{collections::HashSet, io::BufReader};
#[cfg(target_os = "linux")]
use std::{fs::metadata, path::PathBuf};
use tauri::async_runtime::spawn_blocking;
use tauri::utils::config;

use crate::configuration_loader::FilamentJsonSchema;
use crate::configuration_loader::PrinterModelJsonSchema;
use crate::configuration_loader::PrinterVariantJsonSchema;
use crate::configuration_loader::ProcessJsonSchema;
use crate::configuration_loader::VendorJsonSchema;

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
pub fn delete_file(path: &str) -> Result<(), String> {
    let deleted_res = fs::remove_file(path);
    match deleted_res {
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

#[tauri::command]
pub async fn find_possible_values(
    files_to_check: Vec<String>,
    prop_name: String,
) -> Option<Vec<Value>> {
    let result = spawn_blocking(move || {
        let mut values = HashSet::new();

        for path in files_to_check {
            let file = File::open(&path).ok()?;
            let reader = BufReader::new(file);
            let json: Value = serde_json::from_reader(reader).ok()?;

            let value_res = json.get(prop_name.clone());

            if value_res.is_some() {
                if value_res.unwrap().is_string() {
                    values.insert(value_res.unwrap().clone());
                } else if value_res.unwrap().is_array() {
                    let value_arr = value_res.unwrap().as_array().unwrap();
                    value_arr.iter().for_each(|el| {
                        values.insert(el.clone());
                    });
                }
            }
        }

        Some(values.into_iter().collect::<Vec<_>>())
    })
    .await
    .ok()?; // .ok() here handles if the thread panicked

    result
}

pub fn duplicate_vendor_files(
    old_directory_path: &PathBuf,
    new_directory_path: &PathBuf,
    old_file_path: &PathBuf,
    new_file_path: &PathBuf,
) -> Result<(), String> {
    let dir_copy_options = dir::CopyOptions {
        overwrite: false,
        skip_exist: false,
        buffer_size: 64_000,
        copy_inside: true, // If true, copies contents *inside* src instead of src folder itself
        ..Default::default()
    };

    let file_copy_options = file::CopyOptions {
        overwrite: false,
        skip_exist: false,
        buffer_size: 64_000,
        ..Default::default()
    };

    let dir_copy_res = dir::copy(old_directory_path, new_directory_path, &dir_copy_options);
    let file_copy_res = file::copy(old_file_path, new_file_path, &file_copy_options);

    if dir_copy_res.is_err() || file_copy_res.is_err() {
        if dir_copy_res.is_err() {
            Err(dir_copy_res.err().unwrap().to_string()
                + "\nYou may need to relaunch the app as administrator")
        } else {
            Err(file_copy_res.err().unwrap().to_string()
                + "\nYou may need to relaunch the app as administrator")
        }
    } else {
        Ok(())
    }
}

pub fn replace_name(
    name: &str,
    old_dir_name: &str,
    new_dir_name: &str,
    orca_filament_library_filaments: &HashSet<String>,
) -> String {
    let ret_name: String;

    if orca_filament_library_filaments.contains(name) {
        ret_name = name.to_string();
    } else if name.contains(old_dir_name) {
        ret_name = name.replace(old_dir_name, new_dir_name);
    } else if name.contains(&old_dir_name.to_lowercase()) {
        ret_name = name.replace(&old_dir_name.to_lowercase(), &new_dir_name.to_lowercase());
    } else {
        ret_name = (new_dir_name.to_string() + " " + name).into();
    }

    ret_name.replace("/", " ")
}

pub fn remove_nulls(value: &mut Value) {
    match value {
        Value::Object(map) => {
            map.retain(|_, v| {
                remove_nulls(v);
                !v.is_null()
            });
        }
        Value::Array(arr) => {
            arr.iter_mut().for_each(remove_nulls);
            arr.retain(|v| !v.is_null());
        }
        _ => {}
    }
}

#[tauri::command]
pub fn duplicate_vendor(
    path: &str,
    new_dir_name: &str,
    orca_filament_library_filaments: Vec<String>,
) -> Result<(), String> {
    dbg!(&orca_filament_library_filaments);
    let orca_filament_library_filaments: HashSet<String> =
        orca_filament_library_filaments.into_iter().collect();

    let path = path::Path::new(path);
    let parent_directory = path.parent().unwrap();

    let path_stem = path.file_stem().unwrap();
    let path_extension = path.extension().unwrap();

    let new_directory_path = parent_directory.join(Path::new(new_dir_name));
    let old_directory_path = parent_directory.join(path_stem);

    let mut path_extension_combined = OsString::from(new_dir_name);
    path_extension_combined.push(".");
    path_extension_combined.push(path_extension);

    let new_file_path = parent_directory.join(path_extension_combined);

    duplicate_vendor_files(
        &old_directory_path,
        &new_directory_path,
        &path.to_path_buf(),
        &new_file_path,
    )?;

    let old_dir_name = path_stem.to_str().unwrap();

    let new_vendor_config_data = fs::read_to_string(&new_file_path).unwrap();

    let mut parsed_vendor_config: VendorJsonSchema =
        serde_json::from_str(&new_vendor_config_data).unwrap();

    parsed_vendor_config.name = new_dir_name.to_string();

    if parsed_vendor_config.machine_list.is_some() {
        parsed_vendor_config
            .machine_list
            .as_mut()
            .unwrap()
            .iter_mut()
            .for_each(|el| {
                let old_sub_path = el.sub_path.clone();
                let sub_path_path = Path::new(&el.sub_path);
                let sub_path_parent = sub_path_path.parent().unwrap();

                let new_name = replace_name(
                    &el.name,
                    old_dir_name,
                    new_dir_name,
                    &orca_filament_library_filaments,
                );
                el.name = new_name.clone();

                let new_sub_path =
                    sub_path_parent.to_str().unwrap().to_string() + "/" + &el.name + ".json";
                el.sub_path = new_sub_path;

                let old_file_path = new_directory_path.join(old_sub_path);
                let new_file_path = new_directory_path.join(el.sub_path.clone());

                let file_move_options = file::CopyOptions {
                    overwrite: false,
                    skip_exist: false,
                    buffer_size: 64_000,
                    ..Default::default()
                };

                file::move_file(old_file_path, new_file_path.clone(), &file_move_options).ok();

                let config_data = fs::read_to_string(&new_file_path).unwrap();
                let mut parsed_config_file: PrinterVariantJsonSchema =
                    serde_json::from_str(&config_data).unwrap();

                parsed_config_file.name = new_name;

                match parsed_config_file.inherits {
                    Some(inh) => {
                        parsed_config_file.inherits = Some(replace_name(
                            &inh,
                            old_dir_name,
                            new_dir_name,
                            &orca_filament_library_filaments,
                        ));
                    }
                    None => (),
                }

                if let Some(pm) = parsed_config_file.printer_model {
                    let replaced = replace_name(
                        &pm,
                        old_dir_name,
                        new_dir_name,
                        &orca_filament_library_filaments,
                    );
                    parsed_config_file.printer_model = Some(replaced);
                }

                let default_print_profile_res =
                    parsed_config_file.extra.0.get("default_print_profile");

                match default_print_profile_res {
                    Some(default_print_profile) => {
                        let new_default_print_profile = replace_name(
                            default_print_profile.as_str().unwrap(),
                            old_dir_name,
                            new_dir_name,
                            &orca_filament_library_filaments,
                        );

                        parsed_config_file.extra.0.insert(
                            "default_print_profile".to_string(),
                            Value::String(new_default_print_profile),
                        );
                    }
                    None => (),
                }

                let default_filament_profile_res =
                    parsed_config_file.extra.0.get("default_filament_profile");

                match default_filament_profile_res {
                    Some(default_filament_profile) => {
                        let new_material_names: Vec<_> = default_filament_profile
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|material_name| {
                                let material_name_str = material_name.as_str().unwrap();

                                Value::String(replace_name(
                                    material_name_str,
                                    old_dir_name,
                                    new_dir_name,
                                    &orca_filament_library_filaments,
                                ))
                            })
                            .collect();

                        parsed_config_file.extra.0.insert(
                            "default_filament_profile".to_string(),
                            Value::Array(new_material_names),
                        );
                    }
                    None => (),
                }

                let mut parsed_config_file_value =
                    serde_json::to_value(&parsed_config_file).unwrap();
                remove_nulls(&mut parsed_config_file_value);

                let pretty_json = serde_json::to_string_pretty(&parsed_config_file_value).unwrap();

                write_to_file(new_file_path.to_str().unwrap().to_string(), pretty_json).ok();
            });
    }

    if parsed_vendor_config.machine_model_list.is_some() {
        parsed_vendor_config
            .machine_model_list
            .as_mut()
            .unwrap()
            .iter_mut()
            .for_each(|el| {
                let old_sub_path = el.sub_path.clone();
                let sub_path_path = Path::new(&el.sub_path);
                let sub_path_parent = sub_path_path.parent().unwrap();

                let new_name = replace_name(
                    &el.name,
                    old_dir_name,
                    new_dir_name,
                    &orca_filament_library_filaments,
                );
                el.name = new_name.clone();

                let new_sub_path =
                    sub_path_parent.to_str().unwrap().to_string() + "/" + &el.name + ".json";
                el.sub_path = new_sub_path;

                let old_file_path = new_directory_path.join(old_sub_path);
                let new_file_path = new_directory_path.join(el.sub_path.clone());

                let file_move_options = file::CopyOptions {
                    overwrite: false,
                    skip_exist: false,
                    buffer_size: 64_000,
                    ..Default::default()
                };

                file::move_file(old_file_path, new_file_path.clone(), &file_move_options).ok();

                let config_data = fs::read_to_string(&new_file_path).unwrap();
                let mut parsed_config_file: PrinterModelJsonSchema =
                    serde_json::from_str(&config_data).unwrap();

                parsed_config_file.name = new_name;
                parsed_config_file.family = new_dir_name.to_string();

                let default_materials_res = parsed_config_file.extra.0.get("default_materials");

                match default_materials_res {
                    Some(default_materials) => {
                        let new_material_names: Vec<_> = default_materials
                            .as_str()
                            .unwrap()
                            .split(";")
                            .map(|material_name| {
                                let material_name_str = material_name;

                                replace_name(
                                    material_name_str,
                                    old_dir_name,
                                    new_dir_name,
                                    &orca_filament_library_filaments,
                                )
                            })
                            .collect();

                        parsed_config_file.extra.0.insert(
                            "default_materials".to_string(),
                            Value::String(new_material_names.join(";")),
                        );
                    }
                    None => (),
                }

                let mut parsed_config_file_value =
                    serde_json::to_value(&parsed_config_file).unwrap();
                remove_nulls(&mut parsed_config_file_value);

                let pretty_json = serde_json::to_string_pretty(&parsed_config_file_value).unwrap();

                write_to_file(new_file_path.to_str().unwrap().to_string(), pretty_json).ok();
            });
    }

    if parsed_vendor_config.filament_list.is_some() {
        parsed_vendor_config
            .filament_list
            .as_mut()
            .unwrap()
            .iter_mut()
            .for_each(|el| {
                let old_sub_path = el.sub_path.clone();
                let sub_path_path = Path::new(&el.sub_path);
                let sub_path_parent = sub_path_path.parent().unwrap();

                let new_name = replace_name(
                    &el.name,
                    old_dir_name,
                    new_dir_name,
                    &orca_filament_library_filaments,
                );
                el.name = new_name.clone();

                let new_sub_path =
                    sub_path_parent.to_str().unwrap().to_string() + "/" + &el.name + ".json";
                el.sub_path = new_sub_path;

                let old_file_path = new_directory_path.join(old_sub_path);
                let new_file_path = new_directory_path.join(el.sub_path.clone());

                let file_move_options = file::CopyOptions {
                    overwrite: false,
                    skip_exist: false,
                    buffer_size: 64_000,
                    ..Default::default()
                };

                file::move_file(old_file_path, new_file_path.clone(), &file_move_options).ok();

                let config_data = fs::read_to_string(&new_file_path).unwrap();
                let mut parsed_config_file: FilamentJsonSchema =
                    serde_json::from_str(&config_data).unwrap();

                parsed_config_file.name = new_name;

                match parsed_config_file.inherits {
                    Some(inh) => {
                        parsed_config_file.inherits = Some(replace_name(
                            &inh,
                            old_dir_name,
                            new_dir_name,
                            &orca_filament_library_filaments,
                        ));
                    }
                    None => (),
                }

                let compatible_printers_res = parsed_config_file.extra.0.get("compatible_printers");

                match compatible_printers_res {
                    Some(compatible_printers) => {
                        let new_material_names: Vec<_> = compatible_printers
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|material_name| {
                                let material_name_str = material_name.as_str().unwrap();

                                Value::String(replace_name(
                                    material_name_str,
                                    old_dir_name,
                                    new_dir_name,
                                    &orca_filament_library_filaments,
                                ))
                            })
                            .collect();

                        parsed_config_file.extra.0.insert(
                            "compatible_printers".to_string(),
                            Value::Array(new_material_names),
                        );
                    }
                    None => (),
                }

                let mut parsed_config_file_value =
                    serde_json::to_value(&parsed_config_file).unwrap();
                remove_nulls(&mut parsed_config_file_value);

                let pretty_json = serde_json::to_string_pretty(&parsed_config_file_value).unwrap();

                write_to_file(new_file_path.to_str().unwrap().to_string(), pretty_json).ok();
            });
    }

    if parsed_vendor_config.process_list.is_some() {
        parsed_vendor_config
            .process_list
            .as_mut()
            .unwrap()
            .iter_mut()
            .for_each(|el| {
                let old_sub_path = el.sub_path.clone();
                let sub_path_path = Path::new(&el.sub_path);
                let sub_path_parent = sub_path_path.parent().unwrap();

                let new_name = replace_name(
                    &el.name,
                    old_dir_name,
                    new_dir_name,
                    &orca_filament_library_filaments,
                );
                el.name = new_name.clone();

                let new_sub_path =
                    sub_path_parent.to_str().unwrap().to_string() + "/" + &el.name + ".json";
                el.sub_path = new_sub_path;

                let old_file_path = new_directory_path.join(old_sub_path);
                let new_file_path = new_directory_path.join(el.sub_path.clone());

                let file_move_options = file::CopyOptions {
                    overwrite: false,
                    skip_exist: false,
                    buffer_size: 64_000,
                    ..Default::default()
                };

                file::move_file(old_file_path, new_file_path.clone(), &file_move_options).ok();

                let config_data = fs::read_to_string(&new_file_path).unwrap();
                let mut parsed_config_file: ProcessJsonSchema =
                    serde_json::from_str(&config_data).unwrap();

                parsed_config_file.name = new_name;

                match parsed_config_file.inherits {
                    Some(inh) => {
                        parsed_config_file.inherits = Some(replace_name(
                            &inh,
                            old_dir_name,
                            new_dir_name,
                            &orca_filament_library_filaments,
                        ));
                    }
                    None => (),
                }

                let compatible_printers_res = parsed_config_file.extra.0.get("compatible_printers");

                match compatible_printers_res {
                    Some(compatible_printers) => {
                        let new_material_names: Vec<_> = compatible_printers
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|material_name| {
                                let material_name_str = material_name.as_str().unwrap();

                                Value::String(replace_name(
                                    material_name_str,
                                    old_dir_name,
                                    new_dir_name,
                                    &orca_filament_library_filaments,
                                ))
                            })
                            .collect();

                        parsed_config_file.extra.0.insert(
                            "compatible_printers".to_string(),
                            Value::Array(new_material_names),
                        );
                    }
                    None => (),
                }

                let mut parsed_config_file_value =
                    serde_json::to_value(&parsed_config_file).unwrap();
                remove_nulls(&mut parsed_config_file_value);

                let pretty_json = serde_json::to_string_pretty(&parsed_config_file_value).unwrap();

                write_to_file(new_file_path.to_str().unwrap().to_string(), pretty_json).ok();
            });
    }

    match fs::read_dir(new_directory_path) {
        Ok(entries) => entries
            .filter_map(|entry_red| match entry_red {
                Ok(entry) => {
                    let path = entry.path();

                    if entry.path().is_file()
                        && path.extension().and_then(|ext| ext.to_str()) == Some("png")
                    {
                        Some(entry)
                    } else {
                        None
                    }
                }
                Err(_) => None,
            })
            .for_each(|entry| {
                let img_path = entry.path();
                let old_name = img_path.file_stem().unwrap();
                let new_name = replace_name(
                    old_name.to_str().unwrap(),
                    old_dir_name,
                    new_dir_name,
                    &orca_filament_library_filaments,
                );

                let new_img_path = img_path.parent().unwrap().join(new_name + ".png");
                let file_move_options = file::CopyOptions {
                    overwrite: false,
                    skip_exist: false,
                    buffer_size: 64_000,
                    ..Default::default()
                };

                file::move_file(img_path, new_img_path, &file_move_options).ok();
            }),
        Err(_err) => (),
    }

    let mut parsed_config_file_value = serde_json::to_value(&parsed_vendor_config).unwrap();
    remove_nulls(&mut parsed_config_file_value);

    let pretty_json = serde_json::to_string_pretty(&parsed_config_file_value).unwrap();

    write_to_file(new_file_path.to_str().unwrap().to_string(), pretty_json).ok();

    Ok(())
}
