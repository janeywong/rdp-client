use serde_json::json;
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_store::StoreExt;
use time::{format_description, OffsetDateTime, UtcOffset};
#[cfg(target_os = "windows")]
use std::path::Path;
#[cfg(target_os = "windows")]
use winreg::{
    enums::*,
    RegKey,
};
#[cfg(not(target_os = "windows"))]
use tauri::Manager;
#[cfg(not(target_os = "windows"))]
use tauri_plugin_shell::ShellExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 后续通过license控制
///
/// # Arguments
///
/// * `ip`:
///
/// returns: bool
///
/// # Examples
///
/// ```
///
/// ```
#[tauri::command]
fn check_pve(ip: &str) -> bool {
    let v = vec!["192.168.1.210", "10.10.10.2"];
    v.contains(&ip)
}

#[tauri::command]
fn save_registry(ip: &str) -> Result<String, tauri::Error> {
    log::info!("{} 准备保存注册表", ip);
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = Path::new("Software").join("Microsoft").join("Terminal Server Client").join("LocalDevices");
        let (key, disp) = hkcu.create_subkey(&path)?;

        match disp {
            REG_CREATED_NEW_KEY => log::info!("new key has been created: {:?}", key),
            REG_OPENED_EXISTING_KEY => log::info!("key has been opened: {:?}", key)
        }

        key.set_value(ip, &1023u32)?;
        let dword_val: u32 = key.get_value(ip)?;
        log::info!("{} = {}", ip, dword_val);
        Ok(format!("{} = {}", ip, dword_val).into())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok("当前系统不是windows系统，不需要操作注册表".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                // 通过自定义日志格式修复时区问题
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "{} {} [{}] {}",
                        OffsetDateTime::now_utc()
                            .to_offset(UtcOffset::from_hms(8, 0, 0).unwrap())
                            .format(
                                &format_description::parse(
                                    "[year]-[month]-[day] [hour]:[minute]:[second]"
                                )
                                    .unwrap()
                            )
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
        .invoke_handler(tauri::generate_handler![greet, save_registry, check_pve])
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
                        Some(client_conf) => {
                            let client_path = client_conf.get("rdpClientPath").unwrap();
                            if client_path != "" {
                                log::info!("rdpClientPath: {}", client_path);
                                return Ok(());
                            }
                        }
                        None => {
                            #[cfg(target_os = "windows")]
                            {
                                // windows安装包自带，直接在安装路径下面找
                                let mut dir = tauri_utils::platform::current_exe()?;
                                dir.pop();
                                let freerdp_path = dir
                                    .join("freerdp.exe")
                                    .as_path()
                                    .display()
                                    .to_string()
                                    .replace("\t", "")
                                    .replace("\n", "");
                                log::info!("freerdp_path :{}", freerdp_path);
                                store.set("client", json!({"rdpClientPath": freerdp_path}));
                            }

                            #[cfg(not(target_os = "windows"))]
                            {
                                let bin = "xfreerdp";
                                log::info!("find freerdp executable location: which {}", bin);
                                let shell = app.app_handle().shell();
                                let output = tauri::async_runtime::block_on(async move {
                                    shell.command("which").args([bin]).output().await.unwrap()
                                });
                                if output.status.success() {
                                    let path =
                                        String::from_utf8(output.stdout).unwrap().replace("\n", "");
                                    log::info!("freerdp_path: {}", path);
                                    store.set("client", json!({"rdpClientPath": path}))
                                } else {
                                    log::info!("Exit with code: {}", output.status.code().unwrap());
                                }
                            }
                        }
                    }
                }
                Err(err) => {
                    log::error!("store 异常 {:?}", err);
                    return Ok(());
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
