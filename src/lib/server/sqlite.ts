import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from '../../../shared/sqlite-schema';

export const sqlitePath = process.env.KRISPOINT_SOLO_DB_PATH ||
  process.env.KRISPOINT_SQLITE_PATH ||
  join(process.env.APPDATA || join(homedir(), '.krispoint'), 'krispoint.sqlite');

mkdirSync(dirname(sqlitePath), { recursive: true });

const database = new Database(sqlitePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.pragma('busy_timeout = 5000');

const normalize = (value: unknown): string | number | bigint | Buffer | null => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return JSON.stringify(value);
  return value as string | number | bigint | Buffer;
};

const initialize = () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS krispoint_schema_versions (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const current = database.prepare(
    'SELECT COALESCE(MAX(version), 0) AS version FROM krispoint_schema_versions'
  ).get() as { version: number };

  if (current.version < 1) {
    database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, description TEXT, level INTEGER DEFAULT 0, is_system INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, description TEXT, category TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS role_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER NOT NULL, permission_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, email TEXT, password TEXT NOT NULL, full_name TEXT NOT NULL, title TEXT, license_number TEXT, specialty TEXT, department TEXT, institution TEXT, designation TEXT, role_id INTEGER NOT NULL, signature_url TEXT, signature_name TEXT, security_question TEXT, security_answer TEXT, failed_login_attempts INTEGER DEFAULT 0, locked_until TEXT, last_login_at TEXT, last_password_change_at TEXT, must_change_password INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, is_verified INTEGER DEFAULT 0, deleted_at TEXT, created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, session_token TEXT NOT NULL UNIQUE, refresh_token TEXT, ip_address TEXT, user_agent TEXT, device_info TEXT, expires_at TEXT NOT NULL, refresh_expires_at TEXT, is_valid INTEGER DEFAULT 1, revoked_at TEXT, revoked_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, mrn TEXT NOT NULL, hashed_mrn TEXT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, middle_name TEXT, date_of_birth TEXT, gender TEXT, phone TEXT, email TEXT, address TEXT, is_active INTEGER DEFAULT 1, created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER, accession_number TEXT, modality TEXT NOT NULL, body_region TEXT, study_date TEXT, patient_age INTEGER, patient_age_unit TEXT, indication TEXT, referring_physician TEXT, technique TEXT, comparison TEXT, content TEXT, findings TEXT, impressions TEXT, recommendations TEXT, status TEXT DEFAULT 'DRAFT', priority TEXT DEFAULT 'ROUTINE', is_from_worklist INTEGER DEFAULT 0, created_by INTEGER NOT NULL, opened_by INTEGER, opened_at TEXT, assigned_specialist_id INTEGER, submitted_by INTEGER, submitted_at TEXT, reviewed_by INTEGER, signed_by INTEGER, signed_at TEXT, status_before_sign TEXT, reporting_duration_ms INTEGER, review_duration_ms INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS report_amendments (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, amendment_type TEXT NOT NULL, reason TEXT NOT NULL, content TEXT NOT NULL, status TEXT DEFAULT 'DRAFT', created_by INTEGER NOT NULL, created_at TEXT, updated_at TEXT, assigned_specialist_id INTEGER, submitted_at TEXT, signed_by INTEGER, signed_at TEXT);
    CREATE TABLE IF NOT EXISTS report_workflows (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, event TEXT NOT NULL, user_id INTEGER NOT NULL, user_role TEXT, occurred_at TEXT NOT NULL, assigned_to_id INTEGER, metadata TEXT);
    CREATE TABLE IF NOT EXISTS report_metrics_daily (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, user_id INTEGER, user_role TEXT, modality TEXT, department TEXT, report_count INTEGER DEFAULT 0, total_reporting_time_ms INTEGER DEFAULT 0, avg_reporting_time_ms INTEGER DEFAULT 0, min_reporting_time_ms INTEGER, max_reporting_time_ms INTEGER, review_count INTEGER DEFAULT 0, total_review_time_ms INTEGER DEFAULT 0, avg_review_time_ms INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS worklist (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, modality TEXT NOT NULL, body_region TEXT, study_description TEXT, accession_number TEXT, study_date TEXT, priority TEXT DEFAULT 'ROUTINE', indication TEXT, referring_physician TEXT, status TEXT DEFAULT 'PENDING', report_id INTEGER, picked_up_by INTEGER, picked_up_at TEXT, created_by INTEGER NOT NULL, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, modality TEXT, body_region TEXT, comparison_html TEXT, technique_html TEXT, findings_html TEXT, impression_html TEXT, content TEXT NOT NULL, variables TEXT, voice_command TEXT, is_system INTEGER DEFAULT 0, is_global INTEGER DEFAULT 0, department_id TEXT, created_by INTEGER NOT NULL, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS macros (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, voice_command TEXT, category TEXT, content TEXT NOT NULL, variables TEXT, is_system INTEGER DEFAULT 0, is_global INTEGER DEFAULT 0, created_by INTEGER NOT NULL, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS user_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, voice_command_pool TEXT DEFAULT 'system', preferences TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS organization_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT, description TEXT, updated_by INTEGER, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS user_presence (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, is_online INTEGER DEFAULT 0, last_seen_at TEXT, status TEXT DEFAULT 'available', created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, content TEXT NOT NULL, is_read INTEGER DEFAULT 0, read_at TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS report_editors (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, user_id INTEGER NOT NULL, last_heartbeat TEXT NOT NULL, created_at TEXT);
    CREATE TABLE IF NOT EXISTS report_edit_locks (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL UNIQUE, user_id INTEGER NOT NULL, acquired_at TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, username TEXT, user_role TEXT, action TEXT NOT NULL, category TEXT NOT NULL, severity TEXT DEFAULT 'INFO', resource_type TEXT, resource_id TEXT, description TEXT, old_value TEXT, new_value TEXT, metadata TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT, checksum TEXT);
    CREATE TABLE IF NOT EXISTS voice_training_samples (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, audio_path TEXT NOT NULL, audio_duration INTEGER, audio_format TEXT DEFAULT 'wav', raw_transcript TEXT NOT NULL, verified_transcript TEXT, formatted_transcript TEXT, corrected_transcript TEXT, admin_edited_transcript TEXT, final_transcript TEXT, report_id INTEGER, report_type TEXT, session_id TEXT, word_count INTEGER, avg_volume REAL, silence_percent REAL, is_reviewed INTEGER DEFAULT 0, reviewed_by INTEGER, reviewed_at TEXT, is_usable INTEGER DEFAULT 1, quality_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TRIGGER IF NOT EXISTS solo_single_user BEFORE INSERT ON users
      WHEN (SELECT COUNT(*) FROM users) >= 1
      BEGIN SELECT RAISE(ABORT, 'KrisPoint Solo supports one owner'); END;
    `);
    database.prepare(
      'INSERT INTO krispoint_schema_versions (version, applied_at) VALUES (?, ?)'
    ).run(1, new Date().toISOString());
  }
};

export const createSqliteDb = () => {
  initialize();
  return drizzle(async (sql, params, method) => {
    const statement = database.prepare(sql);
    const values = params.map(normalize);
    if (method === 'run') {
      const result = statement.run(...values);
      return { rows: [], lastInsertRowid: Number(result.lastInsertRowid) };
    }
    statement.raw(true);
    const rows = method === 'get'
      ? [statement.get(...values)]
      : statement.all(...values);
    return { rows: rows.filter(Boolean) as unknown[][] };
  }, { schema });
};