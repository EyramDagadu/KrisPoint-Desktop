use hmac::{Hmac, Mac};
use rand::RngCore;
use sha2::Sha256;
use std::fs::OpenOptions;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{Manager, State};
use tungstenite::{connect, Message};

type HmacSha256 = Hmac<Sha256>;

// Windows-specific imports for hiding console window
#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Voice server state management
pub struct VoiceServerState {
    process: Arc<Mutex<Option<Child>>>,
    status: Arc<Mutex<ServerStatus>>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub message: String,
    pub progress: u8, // 0-100
    pub url: Option<String>,
}

impl VoiceServerState {
    pub fn new() -> Self {
        VoiceServerState {
            process: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(ServerStatus {
                running: false,
                message: "Not started".to_string(),
                progress: 0,
                url: None,
            })),
        }
    }

    /// Update server status
    fn update_status(&self, running: bool, message: &str, progress: u8) {
        let mut status = self.status.lock().unwrap();
        status.running = running;
        status.message = message.to_string();
        status.progress = progress;
        if !running {
            status.url = None;
        }
    }

    fn voice_server_is_ready(&self, port: u16, health_token: &str) -> bool {
        let Ok((mut socket, _)) =
            connect(voice_url(port, health_token))
        else {
            return false;
        };

        if let tungstenite::stream::MaybeTlsStream::Plain(stream) = socket.get_mut() {
            let timeout = Some(Duration::from_secs(2));
            let _ = stream.set_read_timeout(timeout);
            let _ = stream.set_write_timeout(timeout);
        }

        // The server sends a general connected message first.
        if socket.read().is_err() {
            return false;
        }

        let mut nonce_bytes = [0_u8; 32];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = nonce_bytes
            .iter()
            .map(|byte| format!("{:02x}", byte))
            .collect::<String>();
        let request = serde_json::json!({
            "type": "health",
            "nonce": nonce
        });
        if socket
            .send(Message::Text(request.to_string().into()))
            .is_err()
        {
            return false;
        }

        let Ok(message) = socket.read() else {
            return false;
        };
        let Ok(payload) = serde_json::from_str::<serde_json::Value>(&message.to_string()) else {
            return false;
        };

        let identity_matches = payload.get("type").and_then(|value| value.as_str())
            == Some("health")
            && payload
                .get("data")
                .and_then(|data| data.get("service"))
                .and_then(|value| value.as_str())
                == Some("krispoint-voice");
        let Some(proof) = payload
            .get("data")
            .and_then(|data| data.get("proof"))
            .and_then(|value| value.as_str())
        else {
            return false;
        };
        if proof.len() != 64 {
            return false;
        }
        let Ok(proof_bytes) = (0..proof.len())
            .step_by(2)
            .map(|index| u8::from_str_radix(&proof[index..index + 2], 16))
            .collect::<Result<Vec<_>, _>>()
        else {
            return false;
        };
        let Ok(mut mac) = HmacSha256::new_from_slice(health_token.as_bytes()) else {
            return false;
        };
        mac.update(nonce.as_bytes());

        identity_matches && mac.verify_slice(&proof_bytes).is_ok()
    }

    fn refresh_process_state(&self) {
        let exit_message = {
            let mut process_guard = self.process.lock().unwrap();
            let Some(child) = process_guard.as_mut() else {
                return;
            };
            match child.try_wait() {
                Ok(Some(status)) => {
                    process_guard.take();
                    Some(format!("Voice server exited with status: {status}"))
                }
                Ok(None) => None,
                Err(error) => {
                    process_guard.take();
                    Some(format!("Failed to check voice server status: {error}"))
                }
            }
        };

        if let Some(message) = exit_message {
            self.update_status(false, &message, 0);
        }
    }

    /// Try to locate voice server in workspace (for dev mode)
    fn try_workspace_path(&self) -> Result<std::path::PathBuf, String> {
        let cwd = std::env::current_dir().map_err(|e| {
            let error_msg = format!("Failed to get working directory: {}", e);
            self.update_status(false, &error_msg, 0);
            error_msg
        })?;

        // CWD during `tauri dev` is <project>/src-tauri, go up one level
        let project_root = cwd.parent().ok_or_else(|| {
            let error_msg = "Failed to get project root directory".to_string();
            self.update_status(false, &error_msg, 0);
            error_msg
        })?;

        let server_path = project_root.join("vosk-server");
        self.update_status(
            false,
            &format!("Using workspace: {}", server_path.display()),
            15,
        );
        Ok(server_path)
    }

    /// Start the voice server
    pub fn start(&self, app_handle: tauri::AppHandle) -> Result<(), String> {
        self.refresh_process_state();
        let mut process_guard = self.process.lock().unwrap();

        // Check if already running
        if process_guard.is_some() {
            return Ok(());
        }

        self.update_status(false, "Locating voice server...", 10);

        // Prefer the native voice executable produced for release bundles.
        let resource_dir = match app_handle.path().resource_dir() {
            Ok(resource_path) => {
                resource_path
            }
            Err(_) => {
                if cfg!(debug_assertions) {
                    std::env::current_dir().map_err(|e| e.to_string())?
                } else {
                    return Err("Application resource directory is unavailable".to_string());
                }
            }
        };
        let executable_name = if cfg!(windows) { "krispoint-voice.exe" } else { "krispoint-voice" };
        let bundled_executable = [
            resource_dir.join("_up_").join("voice-runtime").join(executable_name),
            resource_dir.join("voice-runtime").join(executable_name),
        ].into_iter().find(|path| path.exists());

        let (program, args, working_dir) = if let Some(executable) = bundled_executable {
            let working_dir = executable
                .parent()
                .ok_or_else(|| "Packaged MedASR runtime directory was not found".to_string())?
                .to_path_buf();
            (executable, Vec::<String>::new(), working_dir)
        } else if cfg!(debug_assertions) {
            let server_dir = self.try_workspace_path()?;
            let python = if cfg!(windows) { "py" } else { "python3.11" };
            let args = if cfg!(windows) {
                vec!["-3.11".into(), "-u".into(), "src/websocket_server.py".into()]
            } else {
                vec!["-u".into(), "src/websocket_server.py".into()]
            };
            (std::path::PathBuf::from(python), args, server_dir)
        } else {
            return Err("MedASR is not installed. Install the KrisPoint Solo + MedASR package.".to_string());
        };
        let listener = std::net::TcpListener::bind(("127.0.0.1", 0))
            .map_err(|e| format!("Cannot reserve voice port: {e}"))?;
        let port = listener.local_addr().map_err(|e| e.to_string())?.port();
        drop(listener);
        let mut token_bytes = [0_u8; 32];
        rand::thread_rng().fill_bytes(&mut token_bytes);
        let health_token = token_bytes
            .iter()
            .map(|byte| format!("{:02x}", byte))
            .collect::<String>();
        let data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Cannot determine Solo data directory: {e}"))?;
        std::fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Cannot create Solo data directory: {e}"))?;
        let log_path = std::env::var_os("KRISPOINT_OFFLINE_VOICE_SMOKE_LOG")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| data_dir.join("voice.log"));
        let voice_log = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&log_path)
            .map_err(|e| format!("Cannot create MedASR log: {e}"))?;
        let voice_error_log = voice_log
            .try_clone()
            .map_err(|e| format!("Cannot open MedASR error log: {e}"))?;

        let mut command = Command::new(&program);
        command
            .args(&args)
            .current_dir(&working_dir)
            .env("VOICE_HEALTH_TOKEN", &health_token)
            .env("VOICE_CLIENT_TOKEN", &health_token)
            .env("KRISPOINT_PARENT_PID", std::process::id().to_string())
            .env("VOICE_HOST", "127.0.0.1")
            .env("VOICE_PORT", port.to_string())
            .env("PYTHONUNBUFFERED", "1")
            .stdin(Stdio::null())
            .stdout(Stdio::from(voice_log))
            .stderr(Stdio::from(voice_error_log));
        #[cfg(windows)]
        command.creation_flags(0x08000000);
        let child = command
            .spawn()
            .map_err(|e| {
                let error_msg = format!(
                    "Failed to start voice server: {}. Reinstall the optional KrisPoint Solo + MedASR package.",
                    e
                );
                self.update_status(false, &error_msg, 0);
                error_msg
            })?;

        // Check if process started successfully
        let pid = child.id();
        self.update_status(false, &format!("Voice process started (PID: {})", pid), 40);

        *process_guard = Some(child);
        drop(process_guard);

        self.update_status(false, "Loading MedASR model...", 50);

        self.update_status(false, "Initializing local speech recognition...", 70);
        for _ in 0..600 {
            {
                let mut process_guard = self.process.lock().unwrap();
                if let Some(child) = process_guard.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            process_guard.take();
                            drop(process_guard);
                            let output = process_log_tail(&log_path);
                            let error_msg = format!(
                                "Voice server exited during startup with status: {status}. Voice output:\n{output}"
                            );
                            self.update_status(false, &error_msg, 0);
                            return Err(error_msg);
                        }
                        Ok(None) => {}
                        Err(e) => {
                            if let Some(mut failed_child) = process_guard.take() {
                                let _ = failed_child.kill();
                                let _ = failed_child.wait();
                            }
                            drop(process_guard);
                            let error_msg = format!("Failed to check voice server status: {}", e);
                            self.update_status(false, &error_msg, 0);
                            return Err(error_msg);
                        }
                    }
                }
            }

            if self.voice_server_is_ready(port, &health_token) {
                self.update_status(true, "Voice server ready!", 100);
                self.status.lock().unwrap().url = Some(voice_url(port, &health_token));
                return Ok(());
            }

            std::thread::sleep(Duration::from_secs(1));
        }

        let _ = self.stop();
        let output = process_log_tail(&log_path);
        let error_msg =
            format!("Voice server did not become ready within ten minutes. Voice output:\n{output}");
        self.update_status(false, &error_msg, 0);
        Err(error_msg)
    }

    /// Stop the voice server
    pub fn stop(&self) -> Result<(), String> {
        let mut process_guard = self.process.lock().unwrap();

        if let Some(mut child) = process_guard.take() {
            self.update_status(false, "Stopping voice server...", 0);

            // Try to kill the process gracefully
            match child.kill() {
                Ok(_) => {
                    // Wait for process to exit
                    let _ = child.wait();
                    self.update_status(false, "Voice server stopped", 0);
                    Ok(())
                }
                Err(e) => Err(format!("Failed to stop voice server: {}", e)),
            }
        } else {
            Ok(())
        }
    }

    /// Get current server status
    pub fn get_status(&self) -> ServerStatus {
        self.refresh_process_state();
        self.status.lock().unwrap().clone()
    }
}

fn process_log_tail(path: &std::path::Path) -> String {
    const LIMIT: usize = 8 * 1024;
    match std::fs::read(path) {
        Ok(bytes) if !bytes.is_empty() => {
            let start = bytes.len().saturating_sub(LIMIT);
            String::from_utf8_lossy(&bytes[start..]).trim().to_string()
        }
        Ok(_) => "(voice server produced no output)".to_string(),
        Err(error) => format!("(unable to read voice log: {error})"),
    }
}

// Tauri commands
#[tauri::command]
pub fn start_voice_server(
    state: State<VoiceServerState>,
    app_handle: tauri::AppHandle,
) -> Result<ServerStatus, String> {
    state.start(app_handle)?;
    Ok(state.get_status())
}

#[tauri::command]
pub fn stop_voice_server(state: State<VoiceServerState>) -> Result<ServerStatus, String> {
    state.stop()?;
    Ok(state.get_status())
}

#[tauri::command]
pub fn get_voice_server_status(state: State<VoiceServerState>) -> ServerStatus {
    state.get_status()
}

fn voice_url(port: u16, token: &str) -> String {
    format!("ws://127.0.0.1:{port}/?token={token}")
}

#[cfg(test)]
mod tests {
    use super::voice_url;

    #[test]
    fn operational_voice_url_contains_dynamic_port_and_client_token() {
        assert_eq!(
            voice_url(49152, "0123456789abcdef"),
            "ws://127.0.0.1:49152/?token=0123456789abcdef"
        );
    }
}
