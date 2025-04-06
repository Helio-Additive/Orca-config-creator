// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod configuration_loader;
use configuration_loader::{
    load_all_system_vendor_profiles, load_printer_model_preset, load_printer_variant_preset,
    PrinterModelJsonSchema, PrinterVariantJsonSchema, VendorJsonSchema,
};
use ts_rs::TS;

// Learn more about Tauri commands at https://v1.tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn greet2(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust 2!", name)
}

fn main() {
    VendorJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    PrinterModelJsonSchema::export_all_to("../src/lib/bindings").unwrap();
    PrinterVariantJsonSchema::export_all_to("../src/lib/bindings").unwrap();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            greet2,
            load_all_system_vendor_profiles,
            load_printer_model_preset,
            load_printer_variant_preset
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
