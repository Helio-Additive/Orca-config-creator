// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commons;
mod configuration_loader;
use commons::check_directory;
use configuration_loader::{
    load_all_printer_model_presets, load_all_printer_presets, load_all_system_vendor_profiles,
    load_all_user_printer_profiles_in_dir, load_printer_model_preset, load_printer_variant_preset,
    MinPrinterModelJsonSchema, MinPrinterVariantJsonSchema, PrinterModelJsonSchema,
    PrinterVariantJsonSchema, VendorJsonSchema,
};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use tauri::api::dialog::blocking::FileDialogBuilder;
use tauri::async_runtime::spawn_blocking;
use ts_rs::TS;
use zip::write::SimpleFileOptions;

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
async fn save_and_zip_json(data: serde_json::Value) -> Result<bool, String> {
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

    let zip_path = base_path.join("Printer presets.zip");

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
            save_and_zip_json,
            check_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
