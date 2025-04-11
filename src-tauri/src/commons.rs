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

#[tauri::command]
pub fn check_file(path: &str) -> bool {
    let path = path::Path::new(path);
    println!("{:?}, {}, {}", path, path.is_dir(), path.is_file());
    if path.is_file() {
        true
    } else {
        false
    }
}
