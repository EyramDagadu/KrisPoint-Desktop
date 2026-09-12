//! Lifecycle management for the packaged Solo SvelteKit server.
//!
//! The UI is still served by Tauri in production, but its API routes need a
//! local node process.  Keeping this process owned by Tauri means it cannot be
//! left running after the desktop application exits.
use rand::RngCore;
use std::fs::OpenOptions;
use std::net::TcpListener;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub(crate) const KEY_SERVICE: &str = "com.krispoint.radiology.solo";

pub struct BackendState(Mutex<Option<Child>>);

impl BackendState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }

    pub fn start(&self, app: &AppHandle) -> Result<(u16, String), String> {
        let mut child = self.0.lock().map_err(|_| "Backend lock poisoned")?;
        if child.is_some() {
            return Err("KrisPoint backend is already running".to_string());
        }
        // `tauri dev` already has the SvelteKit development server on this
        // port.  Treat it as the backend in development; packaged builds
        // always take the sidecar path below.
        if cfg!(debug_assertions) && std::net::TcpStream::connect(("127.0.0.1", 5000)).is_ok() {
            return Ok((5000, String::new()));
        }

        let data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("Cannot determine Solo data directory: {e}"))?;
        std::fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Cannot create Solo data directory: {e}"))?;
        let db_path = data_dir.join("krispoint-solo.sqlite");
        let _ = crate::backup::recover_interrupted_restore(app)?;

        let encryption_key = credential("encryption-key")?;
        let audit_key = credential("audit-key")?;
        let launch_secret = random_hex();
        let listener = TcpListener::bind(("127.0.0.1", 0))
            .map_err(|e| format!("Cannot reserve Solo backend port: {e}"))?;
        let port = listener.local_addr().map_err(|e| e.to_string())?.port();
        drop(listener);
        let (runtime, entry) = backend_entry(app)?;
        let log_path = data_dir.join("backend.log");
        let backend_log = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&log_path)
            .map_err(|e| format!("Cannot create Solo backend log: {e}"))?;
        let backend_error_log = backend_log
            .try_clone()
            .map_err(|e| format!("Cannot open Solo backend error log: {e}"))?;

        let runtime_dir = entry
            .parent()
            .ok_or_else(|| "Packaged Solo backend directory was not found".to_string())?;
        let mut command = Command::new(runtime);
        command.current_dir(runtime_dir).arg("index.js");
        let process = command
            .env("NODE_ENV", "production")
            .env("PORT", port.to_string())
            .env("HOST", "127.0.0.1")
            .env("VITE_KRISPOINT_EDITION", "solo")
            .env("DATABASE_URL", format!("sqlite://{}", db_path.display()))
            .env("KRISPOINT_SOLO_DB_PATH", &db_path)
            // Keep both explicit Solo names and the generic names understood
            // by the server's environment validator.
            .env("SOLO_ENCRYPTION_KEY", &encryption_key)
            .env("ENCRYPTION_KEY", &encryption_key)
            .env("SOLO_AUDIT_KEY", &audit_key)
            .env("AUDIT_SECRET", &audit_key)
            .env("KRISPOINT_LAUNCH_SECRET", &launch_secret)
            .env("KRISPOINT_APP_ORIGIN", format!("http://127.0.0.1:{port}"))
            // Solo never receives a provider key. AI requests are sent by the
            // authenticated SvelteKit server to the hosted gateway.
            .env("KRISPOINT_AI_GATEWAY_URL", "https://ai.krispoint.com.gh")
            .env("KRISPOINT_REMOTE_AI_ENABLED", "true")
            .env("KRISPOINT_PARENT_PID", std::process::id().to_string())
            .stdin(Stdio::null())
            .stdout(Stdio::from(backend_log))
            .stderr(Stdio::from(backend_error_log))
            .spawn()
            .map_err(|e| format!("Unable to start packaged KrisPoint backend: {e}"))?;

        *child = Some(process);
        drop(child);
        wait_until_ready(self, port, &launch_secret, &log_path)?;
        Ok((port, launch_secret))
    }

    pub fn stop(&self) -> Result<(), String> {
        let mut guard = self.0.lock().map_err(|_| "Backend lock poisoned")?;
        if let Some(mut process) = guard.take() {
            process
                .kill()
                .map_err(|e| format!("Unable to stop KrisPoint backend: {e}"))?;
            let _ = process.wait();
        }
        Ok(())
    }
}

impl Drop for BackendState {
    fn drop(&mut self) {
        if let Ok(child) = self.0.get_mut() {
            if let Some(process) = child.as_mut() {
                let _ = process.kill();
                let _ = process.wait();
            }
        }
    }
}

fn backend_entry(app: &AppHandle) -> Result<(std::path::PathBuf, std::path::PathBuf), String> {
    if let Ok(resources) = app.path().resource_dir() {
        // Resources configured from the parent project directory are emitted
        // below `_up_` by Tauri. Keep the direct candidate for platforms or
        // future resource mappings that preserve the target directory.
        for bundled in [
            resources.join("_up_").join("solo-runtime"),
            resources.join("solo-runtime"),
        ] {
            let runtime = bundled.join(if cfg!(windows) { "node.exe" } else { "node" });
            let entry = bundled.join("index.js");
            if runtime.exists() && entry.exists() {
                return Ok((runtime, entry));
            }
        }
    }
    if cfg!(debug_assertions) {
        let local = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .parent()
            .map(|root| root.join("build").join("index.js"))
            .ok_or_else(|| "Cannot locate project root".to_string())?;
        if local.exists() {
            let runtime = std::env::current_exe().map_err(|e| e.to_string())?;
            return Ok((runtime, local));
        }
    }
    Err("Packaged Solo backend runtime was not found".to_string())
}

fn wait_until_ready(
    state: &BackendState,
    port: u16,
    launch_secret: &str,
    log_path: &std::path::Path,
) -> Result<(), String> {
    let client = reqwest::blocking::Client::new();
    for _ in 0..120 {
        let ready = client
            .get(format!("http://127.0.0.1:{port}/api/health/solo"))
            .header("x-krispoint-launch-secret", launch_secret)
            .send()
            .map(|response| response.status().is_success())
            .unwrap_or(false);
        if ready {
            return Ok(());
        }
        if let Ok(mut guard) = state.0.lock() {
            let exit_status = guard
                .as_mut()
                .and_then(|process| process.try_wait().ok().flatten());
            if let Some(status) = exit_status {
                guard.take();
                let output = backend_log_tail(log_path);
                return Err(format!(
                    "KrisPoint backend exited during startup ({status}). Backend output:\n{output}"
                ));
            }
        }
        thread::sleep(Duration::from_millis(250));
    }
    let _ = state.stop();
    Err("KrisPoint backend did not become ready within 30 seconds".to_string())
}

fn backend_log_tail(path: &std::path::Path) -> String {
    const LIMIT: usize = 8 * 1024;
    match std::fs::read(path) {
        Ok(bytes) if !bytes.is_empty() => {
            let start = bytes.len().saturating_sub(LIMIT);
            String::from_utf8_lossy(&bytes[start..]).trim().to_string()
        }
        Ok(_) => "(backend produced no output)".to_string(),
        Err(error) => format!("(unable to read backend log: {error})"),
    }
}

pub(crate) fn read_credential(account: &str) -> Result<String, String> {
    let entry = keyring::Entry::new(KEY_SERVICE, account)
        .map_err(|e| format!("Cannot access OS credential store: {e}"))?;
    match entry.get_password() {
        Ok(value) if !value.is_empty() => Ok(value),
        Ok(_) | Err(keyring::Error::NoEntry) => {
            Err(format!("Required Solo credential '{account}' is missing"))
        }
        Err(e) => Err(format!("Cannot read Solo credential: {e}")),
    }
}

fn credential(account: &str) -> Result<String, String> {
    let entry = keyring::Entry::new(KEY_SERVICE, account)
        .map_err(|e| format!("Cannot access OS credential store: {e}"))?;
    match entry.get_password() {
        Ok(value) if !value.is_empty() => Ok(value),
        Ok(_) | Err(keyring::Error::NoEntry) => {
            let value = random_hex();
            entry
                .set_password(&value)
                .map_err(|e| format!("Cannot save Solo credential: {e}"))?;
            Ok(value)
        }
        Err(e) => Err(format!("Cannot read Solo credential: {e}")),
    }
}

pub(crate) fn set_credential(account: &str, value: &str) -> Result<(), String> {
    keyring::Entry::new(KEY_SERVICE, account)
        .map_err(|e| format!("Cannot access OS credential store: {e}"))?
        .set_password(value)
        .map_err(|e| format!("Cannot save Solo credential: {e}"))
}

pub(crate) fn delete_credential(account: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(KEY_SERVICE, account)
        .map_err(|e| format!("Cannot access OS credential store: {e}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Cannot remove temporary Solo credential: {e}")),
    }
}

fn random_hex() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
