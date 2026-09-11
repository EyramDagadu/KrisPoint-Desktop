import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

// Define our main data structures
export interface Report {
  id?: number;
  patient_name: string;
  patient_mrn: string;
  accession_number: string;
  exam_type: string;
  age: string;
  indication: string;
  findings: string;
  impression: string;
  status: 'draft' | 'finalized';
  created_at: string;
}

export interface Macro {
  id?: number;
  name: string;
  text: string;
}

// Create the writable stores for app state
export const currentReport = writable<Report>(createNewReport());
export const reports = writable<Report[]>([]);
export const macros = writable<Macro[]>([]);
export const isDictating = writable(false);
export const activeTab = writable<'findings' | 'impression'>('findings');

// Helper function to create a new empty report
export function createNewReport(): Report {
  return {
    patient_name: '',
    patient_mrn: '',
    accession_number: '',
    exam_type: '',
    age: '',
    indication: '',
    findings: '',
    impression: '',
    status: 'draft',
    created_at: new Date().toISOString(),
  };
}

// Load all reports and macros from the database
export async function loadAppData() {
  try {
    const [loadedReports, loadedMacros] = await Promise.all([
      invoke('get_all_reports'),
      invoke('get_all_macros')
    ]);
    reports.set(loadedReports as Report[]);
    macros.set(loadedMacros as Macro[]);
  } catch (error) {
    console.error('Failed to load app data:', error);
  }
}