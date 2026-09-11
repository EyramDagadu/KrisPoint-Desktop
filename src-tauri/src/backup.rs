use aes_gcm::{
    aead::{Aead, Payload},
    Aes256Gcm, KeyInit, Nonce,
};
use argon2::Argon2;
use openssl::symm::{Cipher, Crypter, Mode};
use rand::RngCore;
use rusqlite::{backup::Backup, Connection};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};
use tempfile::NamedTempFile;

use crate::backend::{delete_credential, read_credential, set_credential, BackendState};

const MAGIC: &[u8; 8] = b"KPSOLOB1";
const AAD: &[u8] = b"KrisPoint Solo backup v1";
const MAX_BACKUP_BYTES: usize = 512 * 1024 * 1024;
const TEMP_OLD_ENCRYPTION: &str = "restore-old-encryption-key";
const TEMP_OLD_AUDIT: &str = "restore-old-audit-key";
const TEMP_NEW_ENCRYPTION: &str = "restore-new-encryption-key";
const TEMP_NEW_AUDIT: &str = "restore-new-audit-key";

pub struct BackupState(Mutex<()>);

impl BackupState {
    pub fn new() -> Self {
        Self(Mutex::new(()))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupExport {
    file_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    created_at: u64,
    schema_version: i64,
}

#[derive(Serialize, Deserialize)]
struct BackupMetadata {
    format_version: u8,
    created_at: u64,
    schema_version: i64,
    encryption_key: String,
    audit_key: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
enum RestorePhase {
    Prepared,
    DatabaseInstalled,
    KeysInstalled,
    RolledBack,
}

pub(crate) enum RecoveryOutcome {
    Noop,
    RolledBack,
    Committed,
}

#[derive(Serialize, Deserialize)]
struct RestoreJournal {
    generation: u64,
    phase: RestorePhase,
}

pub(crate) fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot determine Solo data directory: {e}"))?
        .join("krispoint-solo.sqlite"))
}

fn restore_paths(target: &Path) -> (PathBuf, PathBuf, PathBuf) {
    (
        target.with_extension("sqlite.restore-journal"),
        target.with_extension("sqlite.pre-restore"),
        target.with_extension("sqlite.restore-staged"),
    )
}

fn sync_file(path: &Path) -> Result<(), String> {
    File::open(path)
        .and_then(|file| file.sync_all())
        .map_err(|e| format!("Cannot safely write {}: {e}", path.display()))
}

#[cfg(unix)]
fn sync_parent(path: &Path) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Restore path has no parent directory".to_string())?;
    File::open(parent)
        .and_then(|directory| directory.sync_all())
        .map_err(|e| format!("Cannot safely update {}: {e}", parent.display()))
}

#[cfg(windows)]
fn sync_parent(_path: &Path) -> Result<(), String> {
    Ok(())
}

fn journal_slots(path: &Path) -> (PathBuf, PathBuf) {
    (
        path.with_extension("restore-journal.1"),
        path.with_extension("restore-journal.2"),
    )
}

fn read_journal_slot(path: &Path) -> Option<RestoreJournal> {
    fs::read(path)
        .ok()
        .and_then(|bytes| serde_json::from_slice(&bytes).ok())
}

fn write_journal(path: &Path, phase: RestorePhase) -> Result<(), String> {
    let (slot_one, slot_two) = journal_slots(path);
    let current = [read_journal_slot(&slot_one), read_journal_slot(&slot_two)]
        .into_iter()
        .flatten()
        .max_by_key(|journal| journal.generation);
    let generation = current.as_ref().map_or(1, |journal| journal.generation + 1);
    let destination = if generation % 2 == 1 {
        slot_one
    } else {
        slot_two
    };
    let temporary = path.with_extension("restore-journal.tmp");
    let mut file =
        File::create(&temporary).map_err(|e| format!("Cannot create restore journal: {e}"))?;
    let bytes = serde_json::to_vec(&RestoreJournal { generation, phase })
        .map_err(|e| format!("Cannot create restore journal: {e}"))?;
    file.write_all(&bytes)
        .and_then(|_| file.sync_all())
        .map_err(|e| format!("Cannot save restore journal: {e}"))?;
    if destination.exists() {
        fs::remove_file(&destination)
            .map_err(|e| format!("Cannot advance restore journal: {e}"))?;
    }
    durable_rename(&temporary, &destination)?;
    sync_parent(&destination)
}

fn read_journal(path: &Path) -> Result<RestoreJournal, String> {
    let (slot_one, slot_two) = journal_slots(path);
    [read_journal_slot(&slot_one), read_journal_slot(&slot_two)]
        .into_iter()
        .flatten()
        .max_by_key(|journal| journal.generation)
        .ok_or_else(|| "Restore journal is missing or invalid".to_string())
}

fn has_journal(path: &Path) -> bool {
    let (slot_one, slot_two) = journal_slots(path);
    slot_one.exists() || slot_two.exists()
}

#[cfg(not(windows))]
fn durable_rename(source: &Path, destination: &Path) -> Result<(), String> {
    fs::rename(source, destination).map_err(|e| format!("Cannot commit restore file: {e}"))
}

#[cfg(windows)]
fn durable_rename(source: &Path, destination: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };
    let source: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let destination: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    let succeeded = unsafe {
        MoveFileExW(
            source.as_ptr(),
            destination.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    };
    if succeeded == 0 {
        Err(format!(
            "Cannot commit restore file: {}",
            std::io::Error::last_os_error()
        ))
    } else {
        Ok(())
    }
}

fn remove_if_exists(path: &Path) -> Result<(), String> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("Cannot remove {}: {error}", path.display())),
    }
}

fn remove_sidecars(target: &Path) -> Result<(), String> {
    for suffix in ["-wal", "-shm"] {
        remove_if_exists(Path::new(&format!("{}{}", target.display(), suffix)))?;
    }
    Ok(())
}

fn cleanup_restore_state(journal: &Path, rollback: &Path, staged: &Path) -> Result<(), String> {
    let (slot_one, slot_two) = journal_slots(journal);
    let journal_temporary = journal.with_extension("restore-journal.tmp");
    for path in [&journal_temporary, rollback, staged] {
        remove_if_exists(path)?;
    }
    for account in [
        TEMP_OLD_ENCRYPTION,
        TEMP_OLD_AUDIT,
        TEMP_NEW_ENCRYPTION,
        TEMP_NEW_AUDIT,
    ] {
        delete_credential(account)?;
    }
    for path in [&slot_one, &slot_two] {
        remove_if_exists(path)?;
    }
    sync_parent(journal)?;
    Ok(())
}

fn restore_old_state(target: &Path, rollback: &Path) -> Result<(), String> {
    if !rollback.exists() {
        return Err("The pre-restore database snapshot is missing".into());
    }
    let old_encryption = read_credential(TEMP_OLD_ENCRYPTION)?;
    let old_audit = read_credential(TEMP_OLD_AUDIT)?;
    let replacement = target.with_extension("sqlite.rollback-staged");
    fs::copy(rollback, &replacement).map_err(|e| format!("Cannot stage database rollback: {e}"))?;
    sync_file(&replacement)?;
    remove_sidecars(target)?;
    if target.exists() {
        fs::remove_file(target).map_err(|e| format!("Cannot remove failed restore: {e}"))?;
    }
    durable_rename(&replacement, target)?;
    sync_parent(target)?;
    set_credential("encryption-key", &old_encryption)?;
    set_credential("audit-key", &old_audit)?;
    Ok(())
}

pub(crate) fn recover_interrupted_restore(app: &AppHandle) -> Result<RecoveryOutcome, String> {
    let target = database_path(app)?;
    let (journal_path, rollback, staged) = restore_paths(&target);
    if !has_journal(&journal_path) {
        return Ok(RecoveryOutcome::Noop);
    }
    let journal = read_journal(&journal_path)?;
    let outcome = match journal.phase {
        RestorePhase::Prepared => {
            restore_old_state(&target, &rollback)?;
            write_journal(&journal_path, RestorePhase::RolledBack)?;
            RecoveryOutcome::RolledBack
        }
        RestorePhase::DatabaseInstalled => {
            set_credential("encryption-key", &read_credential(TEMP_NEW_ENCRYPTION)?)?;
            set_credential("audit-key", &read_credential(TEMP_NEW_AUDIT)?)?;
            write_journal(&journal_path, RestorePhase::KeysInstalled)?;
            RecoveryOutcome::Committed
        }
        RestorePhase::KeysInstalled => RecoveryOutcome::Committed,
        RestorePhase::RolledBack => RecoveryOutcome::RolledBack,
    };
    // The selected data/key outcome is already durable. Cleanup is idempotent
    // housekeeping; retained journal slots let the next startup retry it.
    let _ = cleanup_restore_state(&journal_path, &rollback, &staged);
    Ok(outcome)
}

fn schema_version(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM krispoint_schema_versions",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Cannot read backup schema version: {e}"))
}

fn validate_database(path: &Path) -> Result<i64, String> {
    let connection = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Backup does not contain a readable SQLite database: {e}"))?;
    let integrity: String = connection
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| format!("Cannot check backup integrity: {e}"))?;
    if integrity != "ok" {
        return Err(format!(
            "Backup database failed its integrity check: {integrity}"
        ));
    }
    let foreign_key_errors: i64 = connection
        .query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })
        .map_err(|e| format!("Cannot check backup relationships: {e}"))?;
    if foreign_key_errors != 0 {
        return Err("Backup database contains invalid relationships".into());
    }
    let version = schema_version(&connection)?;
    if version != 1 {
        return Err(format!("Unsupported Solo backup schema version: {version}"));
    }
    Ok(version)
}

fn decode_hex(value: &str) -> Option<Vec<u8>> {
    if value.len() % 2 != 0 {
        return None;
    }
    (0..value.len())
        .step_by(2)
        .map(|index| u8::from_str_radix(&value[index..index + 2], 16).ok())
        .collect()
}

fn validate_recovery_key(path: &Path, recovery_key: &str) -> Result<(), String> {
    if recovery_key.len() != 64 || !recovery_key.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err("Backup recovery key metadata is invalid".into());
    }
    let connection = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Cannot inspect encrypted backup data: {e}"))?;
    let encrypted: Option<String> = connection
        .query_row(
            "SELECT value FROM (
                SELECT first_name AS value FROM patients
                UNION ALL SELECT last_name FROM patients
                UNION ALL SELECT mrn FROM patients
                UNION ALL SELECT date_of_birth FROM patients
            ) WHERE value LIKE '%:%:%' LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();
    let Some(encrypted) = encrypted else {
        return Ok(());
    };
    let parts: Vec<&str> = encrypted.split(':').collect();
    if parts.len() != 3 {
        return Err("Backup contains malformed encrypted patient data".into());
    }
    let iv = decode_hex(parts[0])
        .filter(|value| value.len() == 16)
        .ok_or_else(|| "Backup contains malformed encrypted patient data".to_string())?;
    let tag = decode_hex(parts[1])
        .filter(|value| value.len() == 16)
        .ok_or_else(|| "Backup contains malformed encrypted patient data".to_string())?;
    let ciphertext = decode_hex(parts[2])
        .ok_or_else(|| "Backup contains malformed encrypted patient data".to_string())?;
    let key = Sha256::digest(recovery_key.as_bytes());
    let mut crypter = Crypter::new(Cipher::aes_256_gcm(), Mode::Decrypt, &key, Some(&iv))
        .map_err(|e| format!("Cannot validate backup recovery key: {e}"))?;
    crypter
        .set_tag(&tag)
        .map_err(|e| format!("Cannot validate backup recovery key: {e}"))?;
    let mut plaintext = vec![0; ciphertext.len() + Cipher::aes_256_gcm().block_size()];
    let count = crypter
        .update(&ciphertext, &mut plaintext)
        .and_then(|count| {
            crypter
                .finalize(&mut plaintext[count..])
                .map(|rest| count + rest)
        })
        .map_err(|_| "Backup recovery key does not match its encrypted patient data".to_string())?;
    plaintext.truncate(count);
    Ok(())
}

fn snapshot_database(source_path: &Path, destination_path: &Path) -> Result<(), String> {
    let _ = fs::remove_file(destination_path);
    let source =
        Connection::open(source_path).map_err(|e| format!("Cannot open Solo database: {e}"))?;
    let mut destination = Connection::open(destination_path)
        .map_err(|e| format!("Cannot create database snapshot: {e}"))?;
    Backup::new(&source, &mut destination)
        .and_then(|backup| {
            backup.run_to_completion(128, std::time::Duration::from_millis(20), None)
        })
        .map_err(|e| format!("Cannot snapshot Solo database: {e}"))?;
    sync_file(destination_path)
}

fn authorize_solo_admin(database: &Path, password: &str) -> Result<(), String> {
    if password.is_empty() {
        return Err("Enter your KrisPoint account password".into());
    }
    let connection =
        Connection::open_with_flags(database, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
            .map_err(|e| format!("Cannot verify Solo owner: {e}"))?;
    let password_hash: String = connection
        .query_row(
            "SELECT u.password
             FROM users u
             WHERE u.is_active = 1
               AND EXISTS (
                 SELECT 1 FROM role_permissions rp
                 JOIN permissions p ON p.id = rp.permission_id
                 WHERE rp.role_id = u.role_id AND p.name = 'users.manage'
               )
             LIMIT 1",
            [],
            |row| row.get(0),
        )
        .map_err(|_| "Backup and restore require the Solo owner account".to_string())?;
    if !bcrypt::verify(password, &password_hash)
        .map_err(|e| format!("Cannot verify Solo owner password: {e}"))?
    {
        return Err("KrisPoint account password is incorrect".into());
    }
    Ok(())
}

fn atomic_save(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Backup destination has no parent directory".to_string())?;
    let mut temporary = NamedTempFile::new_in(parent)
        .map_err(|e| format!("Cannot create temporary backup file: {e}"))?;
    temporary
        .write_all(bytes)
        .and_then(|_| temporary.as_file().sync_all())
        .map_err(|e| format!("Cannot safely write backup file: {e}"))?;
    let temporary_path = temporary
        .into_temp_path()
        .keep()
        .map_err(|e| format!("Cannot prepare backup file: {}", e.error))?;
    if let Err(error) = durable_rename(&temporary_path, path) {
        let _ = fs::remove_file(&temporary_path);
        return Err(error);
    }
    sync_parent(path)
}

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    if password.len() < 12 {
        return Err("Backup password must be at least 12 characters".into());
    }
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Cannot protect backup: {e}"))?;
    Ok(key)
}

fn encode_plaintext(metadata: &BackupMetadata, database: &[u8]) -> Result<Vec<u8>, String> {
    let metadata =
        serde_json::to_vec(metadata).map_err(|e| format!("Cannot create backup: {e}"))?;
    let metadata_len =
        u32::try_from(metadata.len()).map_err(|_| "Backup metadata is too large".to_string())?;
    let mut output = Vec::with_capacity(4 + metadata.len() + database.len());
    output.extend_from_slice(&metadata_len.to_le_bytes());
    output.extend_from_slice(&metadata);
    output.extend_from_slice(database);
    Ok(output)
}

fn decode_plaintext(bytes: &[u8]) -> Result<(BackupMetadata, &[u8]), String> {
    if bytes.len() < 5 {
        return Err("The backup contents are invalid".into());
    }
    let metadata_len = u32::from_le_bytes(
        bytes[..4]
            .try_into()
            .map_err(|_| "The backup contents are invalid")?,
    ) as usize;
    let database_offset = 4usize
        .checked_add(metadata_len)
        .filter(|offset| *offset < bytes.len())
        .ok_or_else(|| "The backup contents are invalid".to_string())?;
    let metadata = serde_json::from_slice(&bytes[4..database_offset])
        .map_err(|_| "The backup metadata is invalid".to_string())?;
    Ok((metadata, &bytes[database_offset..]))
}

fn encrypt_backup(
    metadata: &BackupMetadata,
    database: &[u8],
    password: &str,
) -> Result<Vec<u8>, String> {
    let plaintext = encode_plaintext(metadata, database)?;
    let mut salt = [0u8; 16];
    let mut nonce = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut nonce);
    let key = derive_key(password, &salt)?;
    let ciphertext = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| e.to_string())?
        .encrypt(
            Nonce::from_slice(&nonce),
            Payload {
                msg: &plaintext,
                aad: AAD,
            },
        )
        .map_err(|_| "Cannot encrypt backup".to_string())?;
    let mut output = Vec::with_capacity(36 + ciphertext.len());
    output.extend_from_slice(MAGIC);
    output.extend_from_slice(&salt);
    output.extend_from_slice(&nonce);
    output.extend_from_slice(&ciphertext);
    Ok(output)
}

fn decrypt_backup(bytes: &[u8], password: &str) -> Result<(BackupMetadata, Vec<u8>), String> {
    if bytes.len() < 53 || bytes.len() > MAX_BACKUP_BYTES || &bytes[..8] != MAGIC {
        return Err("This is not a valid KrisPoint Solo backup".into());
    }
    let key = derive_key(password, &bytes[8..24])?;
    let plaintext = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| e.to_string())?
        .decrypt(
            Nonce::from_slice(&bytes[24..36]),
            Payload {
                msg: &bytes[36..],
                aad: AAD,
            },
        )
        .map_err(|_| "The backup password is incorrect or the backup is damaged".to_string())?;
    let (metadata, database) = decode_plaintext(&plaintext)?;
    if metadata.format_version != 1
        || metadata.encryption_key.len() != 64
        || metadata.audit_key.len() != 64
    {
        return Err("The backup is missing valid recovery metadata".into());
    }
    Ok((metadata, database.to_vec()))
}

#[tauri::command]
pub fn export_solo_backup(
    app: AppHandle,
    backup_state: State<'_, BackupState>,
    password: String,
    account_password: String,
) -> Result<BackupExport, String> {
    let _operation = backup_state
        .0
        .lock()
        .map_err(|_| "Backup operation lock poisoned")?;
    let source_path = database_path(&app)?;
    if !source_path.exists() {
        return Err("The Solo database has not been created yet".into());
    }
    authorize_solo_admin(&source_path, &account_password)?;
    let snapshot =
        NamedTempFile::new().map_err(|e| format!("Cannot create backup snapshot: {e}"))?;
    snapshot_database(&source_path, snapshot.path())?;
    let version = validate_database(snapshot.path())?;
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    let metadata = BackupMetadata {
        format_version: 1,
        created_at,
        schema_version: version,
        encryption_key: read_credential("encryption-key")?,
        audit_key: read_credential("audit-key")?,
    };
    let database =
        fs::read(snapshot.path()).map_err(|e| format!("Cannot read database snapshot: {e}"))?;
    let encrypted = encrypt_backup(&metadata, &database, &password)?;
    if encrypted.len() > MAX_BACKUP_BYTES {
        return Err("The Solo database is too large for this backup format".into());
    }
    let file_name = format!("krispoint-solo-{created_at}.kpsbackup");
    let destination = rfd::FileDialog::new()
        .add_filter("KrisPoint Solo backup", &["kpsbackup"])
        .set_file_name(&file_name)
        .save_file()
        .ok_or_else(|| "Backup save was cancelled".to_string())?;
    atomic_save(&destination, &encrypted)?;
    Ok(BackupExport { file_name })
}

#[tauri::command]
pub fn restore_solo_backup(
    app: AppHandle,
    backend: State<'_, BackendState>,
    backup_state: State<'_, BackupState>,
    password: String,
    account_password: String,
) -> Result<RestoreResult, String> {
    let _operation = backup_state
        .0
        .lock()
        .map_err(|_| "Backup operation lock poisoned")?;
    if cfg!(debug_assertions) {
        return Err("Restore is available in the packaged KrisPoint Solo application".into());
    }
    let current_database = database_path(&app)?;
    authorize_solo_admin(&current_database, &account_password)?;
    let source = rfd::FileDialog::new()
        .add_filter("KrisPoint Solo backup", &["kpsbackup"])
        .pick_file()
        .ok_or_else(|| "Restore was cancelled".to_string())?;
    let source_size = fs::metadata(&source)
        .map_err(|e| format!("Cannot inspect backup file: {e}"))?
        .len();
    if source_size > MAX_BACKUP_BYTES as u64 {
        return Err("This backup is too large for this version of KrisPoint Solo".into());
    }
    let bytes = fs::read(source).map_err(|e| format!("Cannot read backup file: {e}"))?;
    let (metadata, database) = decrypt_backup(&bytes, &password)?;
    let candidate = NamedTempFile::new().map_err(|e| format!("Cannot stage backup: {e}"))?;
    fs::write(candidate.path(), database).map_err(|e| format!("Cannot stage backup: {e}"))?;
    let version = validate_database(candidate.path())?;
    if version != metadata.schema_version {
        return Err("Backup schema metadata does not match its database".into());
    }
    validate_recovery_key(candidate.path(), &metadata.encryption_key)?;

    backend.stop()?;
    let target = database_path(&app)?;
    let (journal, rollback, staged) = restore_paths(&target);
    if has_journal(&journal) {
        let _ = recover_interrupted_restore(&app)?;
    }
    snapshot_database(&target, &rollback)?;
    fs::copy(candidate.path(), &staged)
        .map_err(|e| format!("Cannot stage restored database: {e}"))?;
    sync_file(&staged)?;
    sync_parent(&staged)?;
    set_credential(TEMP_OLD_ENCRYPTION, &read_credential("encryption-key")?)?;
    set_credential(TEMP_OLD_AUDIT, &read_credential("audit-key")?)?;
    set_credential(TEMP_NEW_ENCRYPTION, &metadata.encryption_key)?;
    set_credential(TEMP_NEW_AUDIT, &metadata.audit_key)?;
    write_journal(&journal, RestorePhase::Prepared)?;

    let operation = (|| -> Result<(), String> {
        if target.exists() {
            fs::remove_file(&target).map_err(|e| format!("Cannot remove current database: {e}"))?;
        }
        remove_sidecars(&target)?;
        durable_rename(&staged, &target)?;
        sync_file(&target)?;
        sync_parent(&target)?;
        validate_database(&target)?;
        write_journal(&journal, RestorePhase::DatabaseInstalled)?;
        set_credential("encryption-key", &metadata.encryption_key)?;
        set_credential("audit-key", &metadata.audit_key)?;
        write_journal(&journal, RestorePhase::KeysInstalled)?;
        let _ = cleanup_restore_state(&journal, &rollback, &staged);
        Ok(())
    })();
    if let Err(error) = operation {
        let recovery = recover_interrupted_restore(&app);
        return match recovery {
            Ok(RecoveryOutcome::RolledBack) => {
                Err(format!("Restore failed; current data was preserved: {error}"))
            }
            Ok(RecoveryOutcome::Committed) => Ok(RestoreResult {
                created_at: metadata.created_at,
                schema_version: version,
            }),
            Ok(RecoveryOutcome::Noop) => Err(format!(
                "Restore failed and no recovery journal was available: {error}"
            )),
            Err(recovery_error) => Err(format!(
                "Restore failed and automatic recovery requires attention: {error}; {recovery_error}"
            )),
        };
    }
    Ok(RestoreResult {
        created_at: metadata.created_at,
        schema_version: version,
    })
}

#[tauri::command]
pub fn restart_solo_backend(
    app: AppHandle,
    backend: State<'_, BackendState>,
) -> Result<(), String> {
    let _ = recover_interrupted_restore(&app)?;
    let (port, launch_secret) = backend.start(&app)?;
    if let Some(window) = app.get_webview_window("main") {
        let url = format!("http://127.0.0.1:{port}/?desktop_token={launch_secret}")
            .parse()
            .map_err(|e| format!("Invalid Solo backend URL: {e}"))?;
        window
            .navigate(url)
            .map_err(|e| format!("Cannot reopen KrisPoint Solo: {e}"))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn metadata() -> BackupMetadata {
        BackupMetadata {
            format_version: 1,
            created_at: 42,
            schema_version: 1,
            encryption_key: "1".repeat(64),
            audit_key: "2".repeat(64),
        }
    }

    #[test]
    fn encrypted_backup_round_trips_without_expanding_database() {
        let database = vec![1, 2, 3, 4];
        let encrypted = encrypt_backup(&metadata(), &database, "a secure backup password").unwrap();
        let (decrypted_metadata, decrypted_database) =
            decrypt_backup(&encrypted, "a secure backup password").unwrap();
        assert_eq!(decrypted_metadata.created_at, 42);
        assert_eq!(decrypted_database, database);
    }

    #[test]
    fn wrong_password_is_rejected() {
        let encrypted =
            encrypt_backup(&metadata(), &[1, 2, 3], "a secure backup password").unwrap();
        assert!(decrypt_backup(&encrypted, "a different secure password").is_err());
    }

    #[test]
    fn malformed_backup_is_rejected() {
        assert!(decrypt_backup(b"not a backup", "a secure backup password").is_err());
    }

    #[test]
    fn atomic_save_replaces_complete_destination() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("backup.kpsbackup");
        fs::write(&destination, b"old backup").unwrap();
        atomic_save(&destination, b"complete new backup").unwrap();
        assert_eq!(fs::read(destination).unwrap(), b"complete new backup");
    }

    #[test]
    fn journal_uses_terminal_rollback_phase() {
        let directory = tempfile::tempdir().unwrap();
        let journal = directory.path().join("restore-journal");
        write_journal(&journal, RestorePhase::Prepared).unwrap();
        write_journal(&journal, RestorePhase::RolledBack).unwrap();
        let current = read_journal(&journal).unwrap();
        assert_eq!(current.phase, RestorePhase::RolledBack);
        assert_eq!(current.generation, 2);
    }

    #[test]
    fn newest_valid_journal_slot_wins() {
        let directory = tempfile::tempdir().unwrap();
        let journal = directory.path().join("restore-journal");
        write_journal(&journal, RestorePhase::Prepared).unwrap();
        write_journal(&journal, RestorePhase::DatabaseInstalled).unwrap();
        let (old_slot, _) = journal_slots(&journal);
        fs::write(old_slot, b"damaged").unwrap();
        assert_eq!(
            read_journal(&journal).unwrap().phase,
            RestorePhase::DatabaseInstalled
        );
    }
}
