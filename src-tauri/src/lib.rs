use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(serde::Serialize)]
pub struct SaveResult {
    pub image_path: String,
    pub json_path: String,
    pub folder_path: String,
}

fn get_base_storage_dir() -> PathBuf {
    dirs::picture_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")))
        .join("PromptStudio")
}

fn sanitize_name(name: &str) -> String {
    let clean: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let trimmed = clean.trim_matches('_');
    if trimmed.is_empty() {
        "Soggetto_Generale".to_string()
    } else {
        trimmed.to_string()
    }
}

#[tauri::command]
fn get_storage_path() -> String {
    let dir = get_base_storage_dir();
    dir.to_string_lossy().to_string()
}

#[tauri::command]
fn open_storage_folder(subject: Option<String>) -> Result<(), String> {
    let mut dir = get_base_storage_dir();
    if let Some(sub) = subject {
        if !sub.trim().is_empty() {
            let clean_sub = sanitize_name(&sub);
            dir = dir.join(clean_sub);
        }
    }
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn save_generation_to_disk(
    subject_name: String,
    filename_prefix: String,
    image_data_url: String,
    config_json: String,
) -> Result<SaveResult, String> {
    let clean_subject = sanitize_name(&subject_name);
    let target_dir = get_base_storage_dir().join(&clean_subject);
    fs::create_dir_all(&target_dir).map_err(|e| format!("Impossibile creare cartella: {}", e))?;

    let base_name = sanitize_name(&filename_prefix);
    let img_file_path = target_dir.join(format!("{}.png", base_name));
    let json_file_path = target_dir.join(format!("{}.json", base_name));

    // Extract base64 payload
    let b64_payload = if let Some(idx) = image_data_url.find(',') {
        &image_data_url[idx + 1..]
    } else {
        &image_data_url
    };

    let bytes = BASE64
        .decode(b64_payload.trim())
        .map_err(|e| format!("Errore decodifica base64 immagine: {}", e))?;

    fs::write(&img_file_path, bytes)
        .map_err(|e| format!("Impossibile salvare immagine su disco: {}", e))?;

    fs::write(&json_file_path, config_json)
        .map_err(|e| format!("Impossibile salvare configurazione JSON su disco: {}", e))?;

    Ok(SaveResult {
        image_path: img_file_path.to_string_lossy().to_string(),
        json_path: json_file_path.to_string_lossy().to_string(),
        folder_path: target_dir.to_string_lossy().to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_storage_path,
            open_storage_folder,
            save_generation_to_disk
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
