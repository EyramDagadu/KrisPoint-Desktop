// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{
    get_all_reports, save_report, get_all_macros, save_macro, save_pdf
};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_all_reports,
            save_report,
            get_all_macros,
            save_macro,
            save_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}