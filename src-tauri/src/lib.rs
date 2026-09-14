mod voice_server;
mod http_proxy;
mod backend;
mod backup;
mod device_identity;

use std::time::Duration;
use tauri::Manager;
use backend::BackendState;
use backup::BackupState;
use voice_server::VoiceServerState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Initialize voice server state
  let voice_server_state = VoiceServerState::new();
  let backend_state = BackendState::new();
  let backup_state = BackupState::new();

  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .manage(voice_server_state)
    .manage(backend_state)
    .manage(backup_state)
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let offline_voice_smoke = std::env::var_os("KRISPOINT_OFFLINE_VOICE_SMOKE_RESULT")
        .zip(std::env::var_os("KRISPOINT_OFFLINE_VOICE_SMOKE_STOP"));

      // The Solo API is a private, Tauri-owned process.  Starting it here
      // ensures API routes are available before the first window interaction.
      let (backend_port, launch_secret) = app.state::<BackendState>().start(app.handle())?;
      if let Some((result_path, stop_path)) = offline_voice_smoke {
        app.state::<VoiceServerState>().start(app.handle().clone())?;
        let status = app.state::<VoiceServerState>().get_status();
        let url = status.url.ok_or("Voice server did not publish its authenticated URL")?;
        let result_path = std::path::PathBuf::from(result_path);
        let temporary_result = result_path.with_extension("tmp");
        std::fs::write(&temporary_result, serde_json::json!({ "url": url }).to_string())?;
        std::fs::rename(temporary_result, result_path)?;

        let app_handle = app.handle().clone();
        std::thread::spawn(move || {
          let stop_path = std::path::PathBuf::from(stop_path);
          while !stop_path.exists() {
            std::thread::sleep(Duration::from_millis(100));
          }
          let _ = app_handle.state::<VoiceServerState>().stop();
          let _ = app_handle.state::<BackendState>().stop();
          app_handle.exit(0);
        });
        return Ok(());
      }
      if let Some(window) = app.get_webview_window("main") {
      if !cfg!(debug_assertions) {
          let url = format!("http://127.0.0.1:{backend_port}/?desktop_token={launch_secret}")
            .parse()
            .map_err(|e| format!("Invalid Solo backend URL: {e}"))?;
          window.navigate(url)?;
      }
        window.show()?;
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      // Auto-stop voice server when app closes
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        let backend = window.state::<BackendState>();
        if let Err(e) = backend.stop() {
          eprintln!("Failed to stop backend on app close: {}", e);
        }
        let state = window.state::<VoiceServerState>();
        if let Err(e) = state.stop() {
          eprintln!("Failed to stop voice server on app close: {}", e);
        }
      }
    })
    .invoke_handler(tauri::generate_handler![
      voice_server::start_voice_server,
      voice_server::stop_voice_server,
      voice_server::get_voice_server_status,
      http_proxy::http_request,
      backup::export_solo_backup,
      backup::restore_solo_backup,
      backup::restart_solo_backend,
      device_identity::get_solo_machine_id,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
