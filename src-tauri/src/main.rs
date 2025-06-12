// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commons;
mod configuration_loader;
use commons::{
    add_new_prop_to_file, analyse_installed_filament_config, analyse_installed_printer_config,
    analyse_installed_process_config, analyse_vendor_config, check_collision_in_config_file,
    check_directory, check_file, check_in_set, copy_file, create_directory, delete_file,
    duplicate_vendor, find_possible_values, populate_key_set, rename_config, rename_file,
    show_in_folder, write_to_file,
};
use configuration_loader::{
    load_all_filament_presets, load_all_printer_model_presets, load_all_printer_presets,
    load_all_process_presets, load_all_system_vendor_profiles,
    load_all_user_filaments_profiles_in_dir, load_all_user_printer_profiles_in_dir,
    load_all_user_process_profiles_in_dir, load_generic_preset, load_printer_model_preset,
    load_printer_variant_preset, AnalysisMessageDetails, ConfigDetails, ErrWan, FilamentJsonSchema,
    GenericJsonSchema, MinFilamentJsonSchema, MinPrinterModelJsonSchema,
    MinPrinterVariantJsonSchema, MinProcessJsonSchema, PrinterModelJsonSchema,
    PrinterVariantJsonSchema, ProcessJsonSchema, VendorJsonSchema,
};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use tauri::api::dialog::blocking::FileDialogBuilder;
use tauri::async_runtime::spawn_blocking;
use ts_rs::TS;
use zip::write::SimpleFileOptions;

use crate::commons::KeySet;
use std::collections::HashSet;
use std::sync::{Arc, RwLock};

// Learn more about Tauri commands at https://v1.tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn greet2(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust 2!", name)
}

#[tauri::command]
async fn save_and_zip_json(data: serde_json::Value, file_name: String) -> Result<bool, String> {
    // Run the blocking folder picker in a separate thread
    let save_path: Option<PathBuf> = spawn_blocking(move || {
        FileDialogBuilder::new()
            .set_title("Choose where to save the ZIP file")
            .pick_folder()
    })
    .await
    .unwrap_or(None);

    let Some(base_path) = save_path else {
        return Err("No path selected".into());
    };

    let zip_path = base_path.join(file_name);

    // Now spawn the blocking zip logic
    let data_clone = data.clone(); // clone to move into thread
    spawn_blocking(move || {
        let json_str = serde_json::to_string_pretty(&data_clone).map_err(|e| e.to_string())?;

        let file = File::create(&zip_path).map_err(|e| e.to_string())?;
        let mut zip = zip::ZipWriter::new(file);

        let file_name = data_clone
            .get("name")
            .and_then(|v| v.as_str())
            .map(|s| format!("{s}.json"))
            .unwrap_or_else(|| "data.json".to_string());

        zip.start_file(file_name, SimpleFileOptions::default())
            .map_err(|e| e.to_string())?;

        zip.write_all(json_str.as_bytes())
            .map_err(|e| e.to_string())?;

        zip.finish().map_err(|e| e.to_string())?;

        Ok(true)
    })
    .await
    .unwrap_or_else(|e| Err(format!("Task error: {e}")))
}

#[tauri::command]
async fn save_and_zip_json_bundle(
    data: Vec<serde_json::Value>,
    file_names: Vec<String>,
    folder: String,
    zip_name: String,
) -> Result<bool, String> {
    if data.len() != file_names.len() {
        return Err("Data and file_names must be of the same length.".to_string());
    }

    let base_path = PathBuf::from(folder);
    let zip_path = base_path.join(zip_name);

    spawn_blocking(move || {
        let file = File::create(&zip_path).map_err(|e| e.to_string())?;
        let mut zip = zip::ZipWriter::new(file);
        let options = SimpleFileOptions::default();

        for (entry, file_name) in data.into_iter().zip(file_names.into_iter()) {
            let json_str = serde_json::to_string_pretty(&entry)
                .map_err(|e| format!("Serialization error: {e}"))?;

            let file_name = if file_name.ends_with(".json") {
                file_name
            } else {
                format!("{file_name}.json")
            };

            zip.start_file(file_name, options)
                .map_err(|e| format!("Zip start_file error: {e}"))?;

            zip.write_all(json_str.as_bytes())
                .map_err(|e| format!("Zip write error: {e}"))?;
        }

        zip.finish().map_err(|e| format!("Zip finish error: {e}"))?;

        Ok(true)
    })
    .await
    .unwrap_or_else(|e| Err(format!("Task error: {e}")))
}

#[tauri::command]
async fn pick_folder() -> Result<PathBuf, String> {
    // Run the blocking folder picker in a separate thread
    let save_path: Option<PathBuf> = spawn_blocking(move || {
        FileDialogBuilder::new()
            .set_title("Choose where to save the ZIP file")
            .pick_folder()
    })
    .await
    .unwrap_or(None);

    let Some(base_path) = save_path else {
        return Err("No path selected".into());
    };

    Ok(base_path)
}

fn main() {
    #[cfg(dev)]
    {
        let type_export_directory = "../src/lib/bindings";
        VendorJsonSchema::export_all_to(type_export_directory).unwrap();
        PrinterModelJsonSchema::export_all_to(type_export_directory).unwrap();
        MinPrinterModelJsonSchema::export_all_to(type_export_directory).unwrap();
        PrinterVariantJsonSchema::export_all_to(type_export_directory).unwrap();
        FilamentJsonSchema::export_all_to(type_export_directory).unwrap();
        MinPrinterVariantJsonSchema::export_all_to(type_export_directory).unwrap();
        MinFilamentJsonSchema::export_all_to(type_export_directory).unwrap();
        ProcessJsonSchema::export_all_to(type_export_directory).unwrap();
        MinProcessJsonSchema::export_all_to(type_export_directory).unwrap();
        GenericJsonSchema::export_all_to(type_export_directory).unwrap();
        ErrWan::export_all_to(type_export_directory).unwrap();
        ConfigDetails::export_all_to(type_export_directory).unwrap();
        AnalysisMessageDetails::export_all_to(type_export_directory).unwrap();
    }

    tauri::Builder::default()
        .manage(Arc::new(KeySet {
            values: RwLock::new(HashSet::new()),
        }))
        .invoke_handler(tauri::generate_handler![
            greet,
            greet2,
            load_all_system_vendor_profiles,
            load_printer_model_preset,
            load_printer_variant_preset,
            load_generic_preset,
            load_all_filament_presets,
            load_all_printer_model_presets,
            load_all_printer_presets,
            load_all_user_printer_profiles_in_dir,
            load_all_user_filaments_profiles_in_dir,
            load_all_user_process_profiles_in_dir,
            save_and_zip_json,
            check_directory,
            check_file,
            show_in_folder,
            load_all_process_presets,
            write_to_file,
            rename_file,
            rename_config,
            delete_file,
            copy_file,
            create_directory,
            find_possible_values,
            pick_folder,
            save_and_zip_json_bundle,
            duplicate_vendor,
            analyse_vendor_config,
            analyse_installed_filament_config,
            analyse_installed_printer_config,
            analyse_installed_process_config,
            add_new_prop_to_file,
            populate_key_set,
            check_in_set,
            check_collision_in_config_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
