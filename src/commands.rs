use serde::{Deserialize, Serialize};
use tauri::command;
use rusqlite::{params, Connection, Result};
use std::fs;
use std::io::Write;
use tauri::api::path::desktop_dir;

// Define data structures that match our frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct Report {
    pub id: Option<i64>,
    pub patient_name: String,
    pub patient_mrn: String,
    pub accession_number: String,
    pub exam_type: String,
    pub age: String,
    pub indication: String,
    pub findings: String,
    pub impression: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Macro {
    pub id: Option<i64>,
    pub name: String,
    pub text: String,
}

// Initialize SQLite database
fn init_db() -> Result<Connection> {
    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default()).unwrap();
    fs::create_dir_all(&app_dir).unwrap();
    let db_path = app_dir.join("krispoint.db");
    
    let conn = Connection::open(db_path)?;
    
    // Create reports table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY,
            patient_name TEXT NOT NULL,
            patient_mrn TEXT NOT NULL,
            accession_number TEXT NOT NULL,
            exam_type TEXT NOT NULL,
            age TEXT NOT NULL,
            indication TEXT NOT NULL,
            findings TEXT NOT NULL,
            impression TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    
    // Create macros table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS macros (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            text TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

// Command to get all reports
#[command]
pub fn get_all_reports() -> Result<Vec<Report>, String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM reports ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    
    let report_iter = stmt.query_map([], |row| {
        Ok(Report {
            id: row.get(0)?,
            patient_name: row.get(1)?,
            patient_mrn: row.get(2)?,
            accession_number: row.get(3)?,
            exam_type: row.get(4)?,
            age: row.get(5)?,
            indication: row.get(6)?,
            findings: row.get(7)?,
            impression: row.get(8)?,
            status: row.get(9)?,
            created_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut reports = Vec::new();
    for report in report_iter {
        reports.push(report.map_err(|e| e.to_string())?);
    }
    
    Ok(reports)
}

// Command to save a report
#[command]
pub fn save_report(report: Report) -> Result<i64, String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    
    if let Some(id) = report.id {
        // Update existing report
        conn.execute(
            "UPDATE reports SET 
                patient_name = ?, patient_mrn = ?, accession_number = ?, 
                exam_type = ?, age = ?, indication = ?, findings = ?, 
                impression = ?, status = ?, created_at = ?
            WHERE id = ?",
            params![
                report.patient_name, report.patient_mrn, report.accession_number,
                report.exam_type, report.age, report.indication, report.findings,
                report.impression, report.status, report.created_at, id
            ],
        ).map_err(|e| e.to_string())?;
        
        Ok(id)
    } else {
        // Insert new report
        let id = conn.execute(
            "INSERT INTO reports (
                patient_name, patient_mrn, accession_number, exam_type, 
                age, indication, findings, impression, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                report.patient_name, report.patient_mrn, report.accession_number,
                report.exam_type, report.age, report.indication, report.findings,
                report.impression, report.status, report.created_at
            ],
        ).map_err(|e| e.to_string())?;
        
        Ok(id as i64)
    }
}

// Command to get all macros
#[command]
pub fn get_all_macros() -> Result<Vec<Macro>, String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM macros ORDER BY name").map_err(|e| e.to_string())?;
    
    let macro_iter = stmt.query_map([], |row| {
        Ok(Macro {
            id: row.get(0)?,
            name: row.get(1)?,
            text: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut macros = Vec::new();
    for macro_item in macro_iter {
        macros.push(macro_item.map_err(|e| e.to_string())?);
    }
    
    Ok(macros)
}

// Command to save a macro
#[command]
pub fn save_macro(macro_item: Macro) -> Result<i64, String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    
    if let Some(id) = macro_item.id {
        // Update existing macro
        conn.execute(
            "UPDATE macros SET name = ?, text = ? WHERE id = ?",
            params![macro_item.name, macro_item.text, id],
        ).map_err(|e| e.to_string())?;
        
        Ok(id)
    } else {
        // Insert new macro
        let id = conn.execute(
            "INSERT OR REPLACE INTO macros (name, text) VALUES (?, ?)",
            params![macro_item.name, macro_item.text],
        ).map_err(|e| e.to_string())?;
        
        Ok(id as i64)
    }
}

// Command to save PDF to desktop
#[command]
pub fn save_pdf(data: Vec<u8>, file_name: String) -> Result<String, String> {
    let desktop = desktop_dir().ok_or("Could not find desktop directory")?;
    let file_path = desktop.join(file_name);
    
    let mut file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(&data).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().into_owned())
}