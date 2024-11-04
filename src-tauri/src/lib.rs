use tauri::Manager;
use time::{format_description, OffsetDateTime, UtcOffset};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                // 通过自定义日志格式修复时区问题
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "{} {} [{}] {}",
                        OffsetDateTime::now_utc()
                            .to_offset(UtcOffset::from_hms(8, 0, 0).unwrap())
                            .format(&format_description::parse("[year]-[month]-[day] [hour]:[minute]:[second]").unwrap())
                            .unwrap(),
                        record.level(),
                        record.target(),
                        message
                    ))
                })
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
