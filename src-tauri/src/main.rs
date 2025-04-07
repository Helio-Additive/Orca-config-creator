// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod configuration_loader;
use configuration_loader::{
    load_all_printer_model_presets, load_all_printer_presets, load_all_system_vendor_profiles,
    load_all_user_printer_profiles_in_dir, load_preset, load_printer_model_preset,
    load_printer_variant_preset, MinPrinterModelJsonSchema, MinPrinterVariantJsonSchema,
    PrinterModelJsonSchema, PrinterVariantJsonSchema, VendorJsonSchema,
};
use std::fs::File;
use std::io::{Cursor, Write};
use std::path::{Path, PathBuf};
use tauri::{api::dialog::blocking::FileDialogBuilder, api::path::document_dir};
use ts_rs::TS;
use zip::write::{FileOptions, SimpleFileOptions};

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
fn save_and_zip_json(data: serde_json::Value) -> Result<bool, String> {
    // Ask user where to save the file
    let save_path: Option<PathBuf> = FileDialogBuilder::new()
        .set_title("Choose where to save the ZIP file")
        .pick_folder();

    let Some(path) = save_path else {
        return Err("No path selected".into());
    };

    let path = path.join("Printer presets.zip");

    // Write JSON file
    let json_str = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    //std::fs::write(&path, json_str).map_err(|e| e.to_string())?;

    let path_object = Path::new(&path);
    let file = File::create(&path_object).unwrap();

    let mut zip = zip::ZipWriter::new(file);
    zip.start_file(
        data.get("name")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_owned()
            + ".json",
        SimpleFileOptions::default(),
    )
    .unwrap();
    zip.write_all(&json_str.as_bytes()).unwrap();
    zip.finish().unwrap();

    /*// Create zip file in the same directory
    let zip_path = path.with_extension("zip");
    let zip_file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(zip_file);
    let options =
        zip::write::FileOptions::default().compression_method(zip::CompressionMethod::Stored);

    let filename = path.file_name().unwrap().to_string_lossy();
    let json_data = std::fs::read(&path).map_err(|e| e.to_string())?;
    zip.start_file(&filename, options)
        .map_err(|e| e.to_string())?;
    zip.write_all(&json_data).map_err(|e| e.to_string())?;
    zip.finish().map_err(|e| e.to_string())?;*/

    Ok(true)
}

fn main() {
    VendorJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    PrinterModelJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    MinPrinterModelJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    PrinterVariantJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    MinPrinterVariantJsonSchema::export_all_to("../src/lib/bindings").unwrap();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            greet2,
            load_all_system_vendor_profiles,
            load_printer_model_preset,
            load_printer_variant_preset,
            load_all_printer_model_presets,
            load_all_printer_presets,
            load_all_user_printer_profiles_in_dir,
            save_and_zip_json
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
