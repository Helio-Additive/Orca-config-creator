use std::path;

#[tauri::command]
pub fn check_directory(path: &str) -> bool {
    let path = path::Path::new(path);

    if path.is_dir() {
        true
    } else {
        false
    }
}
