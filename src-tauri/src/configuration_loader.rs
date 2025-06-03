use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path;
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
#[serde(rename_all = "lowercase")] // ensures string values like "warning", not "Warning"
pub enum ErrType {
    Error,
    Critical,
    Warning,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ErrWan {
    pub text: String,
    pub r#type: ErrType,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigDetails {
    pub name: String,
    pub file: String,
    pub family: Option<String>,
    pub location: String,
    pub config_type: String,
}

impl ConfigDetails {
    pub fn new(
        name: String,
        file: String,
        family: Option<String>,
        location: String,
        config_type: String,
    ) -> Self {
        Self {
            name,
            file,
            family,
            location,
            config_type,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AnalysisMessageDetails {
    pub config_details: ConfigDetails,
    pub message: ErrWan,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ProcessJsonSchema {
    pub name: String,

    #[serde(rename = "type")]
    pub preset_type: Option<String>,
    pub inherits: Option<String>,
    pub instantiation: Option<String>,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MinProcessJsonSchema {
    name: String,

    #[serde(rename = "type")]
    preset_type: Option<String>,
    inherits: Option<String>,
    instantiation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PrinterModelJsonSchema {
    pub name: String,

    #[serde(rename = "type")]
    pub preset_type: String,
    pub nozzle_diameter: String,
    pub family: String,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MinPrinterModelJsonSchema {
    pub name: String,
    pub nozzle_diameter: String,
    pub family: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PrinterVariantJsonSchema {
    pub name: String,

    #[serde(rename = "type")]
    pub preset_type: Option<String>,
    pub nozzle_diameter: Option<Vec<String>>,
    pub inherits: Option<String>,
    pub instantiation: Option<String>,
    pub printer_model: Option<String>,
    pub printer_variant: Option<String>,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MinPrinterVariantJsonSchema {
    name: String,

    #[serde(rename = "type")]
    preset_type: Option<String>,
    nozzle_diameter: Option<Vec<String>>,
    inherits: Option<String>,
    instantiation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct VendorJsonSchema {
    pub name: String,
    pub version: Option<String>,
    pub machine_model_list: Option<Vec<ConfigNameAndPath>>,
    pub process_list: Option<Vec<ConfigNameAndPath>>,
    pub filament_list: Option<Vec<ConfigNameAndPath>>,
    pub machine_list: Option<Vec<ConfigNameAndPath>>,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FilamentJsonSchema {
    pub name: String,

    #[serde(rename = "type")]
    pub preset_type: Option<String>,
    pub inherits: Option<String>,
    pub instantiation: Option<String>,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MinFilamentJsonSchema {
    name: String,

    #[serde(rename = "type")]
    preset_type: Option<String>,
    inherits: Option<String>,
    instantiation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigNameAndPath {
    pub name: String,
    pub sub_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GenericJsonSchema {
    pub name: String,
    pub inherits: Option<String>,

    #[serde(rename = "type")]
    pub preset_type: Option<String>,

    #[serde(flatten)]
    #[ts(flatten)]
    pub extra: Extra,
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
        Err(_err) => {
            Err("Could not open or read directory. Or the structure is deformed".to_string())
        }
    }
}

#[tauri::command]
pub fn load_all_system_vendor_profiles(
    path: &str,
) -> Result<BTreeMap<String, VendorJsonSchema>, String> {
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
            .collect::<BTreeMap<_, _>>()),
        Err(err) => Err(err),
    }
}

#[tauri::command]
pub fn load_all_user_printer_profiles_in_dir(
    path: &str,
) -> Result<Vec<(String, MinPrinterVariantJsonSchema)>, String> {
    load_all_user_profiles_in_dir(path)
}

#[tauri::command]
pub fn load_all_user_filaments_profiles_in_dir(
    path: &str,
) -> Result<Vec<(String, MinFilamentJsonSchema)>, String> {
    load_all_user_profiles_in_dir(path)
}

#[tauri::command]
pub fn load_all_user_process_profiles_in_dir(
    path: &str,
) -> Result<Vec<(String, MinProcessJsonSchema)>, String> {
    load_all_user_profiles_in_dir(path)
}

pub fn load_all_user_profiles_in_dir<T: DeserializeOwned>(
    path: &str,
) -> Result<Vec<(String, T)>, String> {
    let all_json_files_res = get_all_json_files(path);

    match all_json_files_res {
        Ok(files) => Ok(files
            .into_iter()
            .filter_map(|file| {
                let parsed_config_res = load_preset::<T>(&file);

                match parsed_config_res {
                    Ok(parsed_config) => Some((file, parsed_config)),
                    Err(err) => {
                        println!("{}", err);
                        None
                    }
                }
            })
            .collect()),
        Err(err) => Err(err),
    }
}

pub fn load_all_x_presets<T: DeserializeOwned>(
    path: &str,
    config_name_and_paths: Vec<ConfigNameAndPath>,
) -> Vec<Result<T, String>> {
    config_name_and_paths
        .into_iter()
        .map(|config_name_and_path| {
            let complete_path = path.to_string() + "/" + &config_name_and_path.sub_path;
            let printer_model_res = load_preset::<T>(&complete_path);

            printer_model_res
        })
        .collect()
}

#[tauri::command]
pub fn load_all_printer_model_presets(
    path: &str,
    config_name_and_paths: Vec<ConfigNameAndPath>,
) -> Vec<Result<MinPrinterModelJsonSchema, String>> {
    load_all_x_presets(path, config_name_and_paths)
}

#[tauri::command]
pub fn load_all_filament_presets(
    path: &str,
    config_name_and_paths: Vec<ConfigNameAndPath>,
) -> Vec<Result<MinFilamentJsonSchema, String>> {
    load_all_x_presets(path, config_name_and_paths)
}

#[tauri::command]
pub fn load_all_printer_presets(
    path: &str,
    config_name_and_paths: Vec<ConfigNameAndPath>,
) -> Vec<Result<MinPrinterVariantJsonSchema, String>> {
    load_all_x_presets(path, config_name_and_paths)
}

#[tauri::command]
pub fn load_all_process_presets(
    path: &str,
    config_name_and_paths: Vec<ConfigNameAndPath>,
) -> Vec<Result<MinProcessJsonSchema, String>> {
    load_all_x_presets(path, config_name_and_paths)
}

pub fn load_preset<T: DeserializeOwned>(path: &str) -> Result<T, String> {
    let read_file_res = fs::read_to_string(path);

    match read_file_res {
        Ok(data) => {
            let parsed_config_res: Result<T, _> = serde_json::from_str(&data);

            match parsed_config_res {
                Ok(parsed_config) => Ok(parsed_config),
                Err(err) => Err(format!("Malformed or invalid JSON file: {}\n{}", path, err)),
            }
        }
        _ => Err(format!("Could not read profile: {}", path)),
    }
}

#[tauri::command]
pub fn load_filament_preset(path: &str) -> Result<FilamentJsonSchema, String> {
    load_preset(path)
}

#[tauri::command]
pub fn load_printer_model_preset(path: &str) -> Result<PrinterModelJsonSchema, String> {
    load_preset(path)
}

#[tauri::command]
pub fn load_printer_variant_preset(path: &str) -> Result<PrinterVariantJsonSchema, String> {
    load_preset(path)
}

#[tauri::command]
pub fn load_vendor_preset(path: &str) -> Result<VendorJsonSchema, String> {
    load_preset(path)
}

#[tauri::command]
pub fn load_generic_preset(path: &str) -> Result<GenericJsonSchema, String> {
    load_preset(path)
}
