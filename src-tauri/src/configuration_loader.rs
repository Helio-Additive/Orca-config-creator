use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path;
use tauri::api::file::read_string;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extra(pub HashMap<String, Value>);

impl TS for Extra {
    type WithoutGenerics = Self;

    fn name() -> String {
        "Extra".into()
    }

    fn inline() -> String {
        "Record<string, unknown>".into()
    }

    fn inline_flattened() -> String {
        "Record<string, unknown>".into()
    }

    fn decl() -> String {
        "type Extra = Record<string, unknown>;".to_string()
    }

    fn decl_concrete() -> String {
        "".into()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PrinterModelJsonSchema {
    name: String,

    #[serde(rename = "type")]
    preset_type: String,
    nozzle_diameter: String,
    family: String,

    #[serde(flatten)]
    #[ts(flatten)]
    extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PrinterVariantJsonSchema {
    name: String,

    #[serde(rename = "type")]
    preset_type: String,
    nozzle_diameter: String,
    inherits: String,

    #[serde(flatten)]
    #[ts(flatten)]
    extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct VendorJsonSchema {
    name: String,
    version: String,
    machine_model_list: Vec<ConfigNameAndPath>,
    process_list: Vec<ConfigNameAndPath>,
    filament_list: Vec<ConfigNameAndPath>,
    machine_list: Vec<ConfigNameAndPath>,

    #[serde(flatten)]
    #[ts(flatten)]
    extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigNameAndPath {
    name: String,
    sub_path: String,
}

fn get_all_json_files(path: &str) -> Result<Vec<String>, String> {
    match fs::read_dir(path) {
        Ok(entries) => Ok(
            entries
                .filter_map(|entry_red| match entry_red {
                    Ok(entry) => {
                        let path = entry.path();

                        if entry.path().is_file()
                            && path.extension().and_then(|ext| ext.to_str()) == Some("json")
                        {
                            Some(entry)
                        } else {
                            None
                        }
                    }
                    Err(_) => None,
                })
                .map(|entry| {
                    let path = entry.path();
                    format!("{}", path.display())
                })
                .collect::<Vec<String>>(), // Collect as Vec<String>
        ),
        Err(_err) => Err("Could not open or read directory".to_string()),
    }
}

#[tauri::command]
pub fn load_all_system_vendor_profiles(
    path: &str,
) -> Result<HashMap<String, VendorJsonSchema>, String> {
    let all_vendor_json_files_res = get_all_json_files(path);

    match all_vendor_json_files_res {
        Ok(all_vendor_json_files) => Ok(all_vendor_json_files
            .into_iter()
            .filter_map(|vendor_json_file| {
                let data = fs::read_to_string(&vendor_json_file).unwrap();
                let parsed_vendor_config_res: Result<VendorJsonSchema, _> =
                    serde_json::from_str(&data);

                match parsed_vendor_config_res {
                    Ok(parsed_vendor_config) => {
                        let path_stem = path::Path::new(&vendor_json_file).file_stem().unwrap();

                        Some((
                            path_stem.to_str().unwrap().to_string(),
                            parsed_vendor_config,
                        ))
                    }
                    Err(err) => {
                        println!("{:#?}", err);
                        None
                    }
                }
            })
            .collect::<HashMap<_, _>>()),
        Err(err) => Err(err),
    }
}

pub fn load_preset<T: DeserializeOwned>(path: &str) -> Result<T, String> {
    let read_file_res = fs::read_to_string(path);

    match read_file_res {
        Ok(data) => {
            let parsed_config_res: Result<T, _> = serde_json::from_str(&data);

            match parsed_config_res {
                Ok(parsed_config) => Ok(parsed_config),
                _ => Err(format!("Malformed or invalid JSON file: {}", path)),
            }
        }
        _ => Err(format!("Could not read profile: {}", path)),
    }
}

#[tauri::command]
pub fn load_printer_model_preset(path: &str) -> Result<PrinterModelJsonSchema, String> {
    load_preset(path)
}

#[tauri::command]
pub fn load_printer_variant_preset(path: &str) -> Result<PrinterVariantJsonSchema, String> {
    load_preset(path)
}
