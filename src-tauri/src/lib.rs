mod cmd;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use chrono::{DateTime, Local};
use serde_json::{json};
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                // 通过自定义日志格式修复时区问题
                .format(|out, message, record| {
                    let dt: DateTime<Local> = Local::now().clone().into();
                    out.finish(format_args!(
                        "{} {} [{}] {}",
                        dt.format("%Y-%m-%d %T"),
                        record.level(),
                        record.target(),
                        message
                    ))
                })
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![cmd::greet])
        .setup(|app| {
            #[cfg(debug_assertions)] // 仅在调试构建时包含此代码
            {
                // app.get_webview_window("main").unwrap().open_devtools();
            }
            let store = app.store("store.json");
            match store {
                Ok(ref store) => {
                    let client_conf = store.get("client");
                    match client_conf {
                        None => {}
                        Some(client_conf) => {
                            let client_path = client_conf.get("rdpClientPath").unwrap();
                            if client_path != "" {
                                log::info!("rdpClientPath 已配置 {}", client_path);
                                return Ok(());
                            }
                        }
                    }
                }
                Err(err) => {
                    log::error!("store 取值异常 {:?}", err);
                    return Ok(());
                }
            }

            log::info!("开始从path中查找rdp client路径");

            let command;
            let exe;
            // 获取freerdp的路径
            #[cfg(target_os = "windows")]
            {
                command = "where.exe";
                exe = "sdl-freerdp.exe";
            }
            #[cfg(not(target_os = "windows"))]
            {
                command = "which";
                exe = "xfreerdp";
            }
            log::info!("find executable cmd: {} {}", command, exe);
            let shell = app.app_handle().shell();
            let output = tauri::async_runtime::block_on(async move {
                shell
                    .command(command)
                    .args([exe])
                    .output()
                    .await
                    .unwrap()
            });
            if output.status.success() {
                let path = String::from_utf8(output.stdout).unwrap().replace("\n", "");
                log::info!(
                    "Result: {}",
                    path
                );
                let conf = store.unwrap();
                conf.set("client", json!({"rdpClientPath": path}))
            } else {
                log::info!("Exit with code: {}", output.status.code().unwrap());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
