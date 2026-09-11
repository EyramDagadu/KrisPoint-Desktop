// FileStorageService.js - Desktop file storage for medical reports
import { browser } from '$app/environment';
import { userStorageService } from './UserStorageService.js';

class FileStorageService {
  constructor() {
    this.initialized = false;
    this._invoke = null;
  }

  // Helper method to dynamically import Tauri API
  async _getTauriInvoke() {
    if (!browser) {
      throw new Error('Tauri API not available during SSR');
    }
    
    if (!this._invoke) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        this._invoke = invoke;
      } catch (error) {
        throw new Error('Failed to load Tauri API: ' + error.message);
      }
    }
    
    return this._invoke;
  }

  async init() {
    if (!browser) return false;
    
    try {
      // Test if Tauri commands are available
      const invoke = await this._getTauriInvoke();
      await invoke('get_all_reports');
      this.initialized = true;
      console.log('FileStorageService initialized - using Tauri backend');
      return true;
    } catch (error) {
      console.warn('Tauri backend not available, will use localStorage fallback:', error);
      return false;
    }
  }

  async saveReport(reportData, patientData, doctorName = null) {
    if (!this.initialized) {
      const initSuccess = await this.init();
      if (!initSuccess) {
        return this.saveToLocalStorage(reportData, patientData, doctorName);
      }
    }

    try {
      // Create a complete report object with correct field mappings
      const completeReport = {
        content: reportData.content || '',
        patient_name: patientData.name || 'Unknown Patient',
        patient_id: patientData.mrn || '',  // Use mrn field from patientData
        patient_age: patientData.age || '',
        patient_age_unit: patientData.ageUnit || 'years',  // Age unit (days/months/years)
        patient_gender: patientData.gender || '',  // Use gender field from patientData
        study_type: patientData.examType || '',  // Use examType field from patientData
        study_subtype: patientData.examSubtype || '',  // Add examSubtype field (body part)
        indication: patientData.indication || '',  // Add indication field
        study_date: patientData.studyDate || new Date().toISOString().split('T')[0],
        accession_number: patientData.accessionNumber || '',  // Add accessionNumber field
        referring_physician: '',  // Not available in current patientData structure
        doctor_name: doctorName || 'Unknown Doctor',  // Add doctor name
        specialist_name: patientData.specialistName || '',  // Specialist co-signer (for residents)
        specialist_designation: patientData.specialistDesignation || 'Radiologist',  // Specialist title
        status: reportData.status || 'draft',
        created_at: new Date().toISOString(),
        last_modified: reportData.lastModified || new Date().toISOString(),
        finalized_at: reportData.finalizedAt || null
      };

      // Save using Tauri backend command
      const invoke = await this._getTauriInvoke();
      const result = await invoke('save_report', { report: completeReport });
      
      console.log('Report saved to file system via Tauri backend');
      return {
        success: true,
        filename: `${completeReport.patient_name}_${completeReport.created_at}.json`,
        message: 'Report saved to local file system'
      };
    } catch (error) {
      console.error('Failed to save via Tauri backend:', error);
      // Fallback to localStorage
      return this.saveToLocalStorage(reportData, patientData, doctorName);
    }
  }

  async loadReport(reportId) {
    if (!this.initialized) {
      const initSuccess = await this.init();
      if (!initSuccess) {
        return this.loadReportFromLocalStorage(reportId);
      }
    }

    try {
      const invoke = await this._getTauriInvoke();
      const reports = await invoke('get_all_reports');
      const report = reports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      // Convert back to our internal format
      const reportData = {
        content: report.content,
        status: report.status,
        lastModified: report.last_modified,
        finalizedAt: report.finalized_at,
        isDirty: false
      };

      const patientData = {
        name: report.patient_name,
        mrn: report.patient_id,  // Map patient_id back to mrn
        age: report.patient_age,
        ageUnit: report.patient_age_unit || 'years',  // Age unit (days/months/years)
        gender: report.patient_gender || '',  // Map patient_gender back to gender
        examType: report.study_type,  // Map study_type back to examType
        examSubtype: report.study_subtype || '',  // Add examSubtype field (body part)
        indication: report.indication || '',  // Add indication field
        studyDate: report.study_date,
        accessionNumber: report.accession_number || '',  // Add accessionNumber field
        specialistName: report.specialist_name || '',  // Specialist co-signer (for residents)
        specialistDesignation: report.specialist_designation || 'Radiologist'  // Specialist title
      };

      return {
        success: true,
        data: { reportData, patientData },
        report
      };
    } catch (error) {
      console.error('Failed to load report via Tauri, falling back to localStorage:', error);
      return this.loadReportFromLocalStorage(reportId);
    }
  }

  async listReports() {
    if (!this.initialized) {
      const initSuccess = await this.init();
      if (!initSuccess) {
        return this.listReportsFromLocalStorage();
      }
    }

    try {
      const invoke = await this._getTauriInvoke();
      const reports = await invoke('get_all_reports');
      
      // Sort by creation date (newest first)
      const sortedReports = reports
        .map(report => ({
          id: report.id,
          name: report.patient_name,
          studyType: report.study_type,
          studySubtype: report.study_subtype || '',
          studyDate: report.study_date,
          doctorName: report.doctor_name || 'Unknown Doctor',
          status: report.status,
          dateCreated: report.created_at,
          lastModified: report.last_modified,
          finalizedAt: report.finalized_at
        }))
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

      return {
        success: true,
        reports: sortedReports,
        count: sortedReports.length
      };
    } catch (error) {
      console.error('Failed to list reports via Tauri, falling back to localStorage:', error);
      return this.listReportsFromLocalStorage();
    }
  }

  async deleteReport(reportId) {
    if (!this.initialized) {
      const initSuccess = await this.init();
      if (!initSuccess) {
        return this.deleteReportFromLocalStorage(reportId);
      }
    }

    try {
      // Note: This would need a delete command in the Tauri backend
      // For now, we'll throw an error indicating it's not implemented
      throw new Error('Delete functionality not yet implemented in backend');
    } catch (error) {
      console.error('Failed to delete report via Tauri, falling back to localStorage:', error);
      return this.deleteReportFromLocalStorage(reportId);
    }
  }

  // Fallback to localStorage if Tauri is not available
  async saveToLocalStorage(reportData, patientData, doctorName = null) {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }

      // Use existing report ID if available, otherwise generate new one
      const reportId = reportData.reportId || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isExistingReport = !!reportData.reportId;
      
      // Create complete report object
      const completeReport = {
        id: reportId,
        content: reportData.content || '',
        patient_name: patientData.name || 'Unknown Patient',
        patient_id: patientData.mrn || '',
        patient_age: patientData.age || '',
        patient_age_unit: patientData.ageUnit || 'years',  // Age unit (days/months/years)
        patient_gender: patientData.gender || '',  // Use gender field from patientData
        study_type: patientData.examType || '',
        study_subtype: patientData.examSubtype || '',
        indication: patientData.indication || '',
        study_date: patientData.studyDate || new Date().toISOString().split('T')[0],
        accession_number: patientData.accessionNumber || '',
        referring_physician: '',
        doctor_name: doctorName || 'Unknown Doctor',  // Add doctor name
        specialist_name: patientData.specialistName || '',  // Specialist co-signer (for residents)
        specialist_designation: patientData.specialistDesignation || 'Radiologist',  // Specialist title
        status: reportData.status || 'draft',
        created_at: new Date().toISOString(),
        last_modified: reportData.lastModified || new Date().toISOString(),
        finalized_at: reportData.finalizedAt || null
      };

      // Get existing reports index
      let reportsIndex = this.getLocalStorageReportsIndex();
      
      // If this is an existing report, preserve the original created_at timestamp
      if (isExistingReport && reportsIndex[reportId]) {
        completeReport.created_at = reportsIndex[reportId].created_at;
      }
      
      // Add or update this report in the index
      reportsIndex[reportId] = {
        id: reportId,
        patient_name: completeReport.patient_name,
        study_type: completeReport.study_type,
        study_subtype: completeReport.study_subtype,
        study_date: completeReport.study_date,
        doctor_name: completeReport.doctor_name,  // Add doctor name to index
        status: completeReport.status,
        created_at: completeReport.created_at,
        last_modified: completeReport.last_modified,
        finalized_at: completeReport.finalized_at
      };
      
      // Save the report data (user-specific)
      userStorageService.setItem(`krispoint_report_${reportId}`, JSON.stringify(completeReport));
      
      // Update the index (user-specific)
      userStorageService.setItem('krispoint_reports_index', JSON.stringify(reportsIndex));
      
      const actionType = isExistingReport ? 'updated' : 'saved';
      console.log(`Report ${actionType} to localStorage (fallback):`, reportId);
      return {
        success: true,
        id: reportId,
        message: `Report ${actionType} to browser storage (fallback)`,
        isNew: !isExistingReport
      };
    } catch (error) {
      throw new Error(`Failed to save to localStorage: ${error.message}`);
    }
  }

  async loadFromLocalStorage() {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        return null;
      }

      const stored = userStorageService.getItem('krispoint_current_report');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  // localStorage fallback for listReports
  async listReportsFromLocalStorage() {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        return { success: false, reports: [] };
      }

      const reportsIndex = this.getLocalStorageReportsIndex();
      const reports = Object.values(reportsIndex)
        .map(report => {
          // For backwards compatibility, try to get studySubtype and doctorName from full report if not in index
          let studySubtype = report.study_subtype || '';
          let doctorName = report.doctor_name || '';
          if ((!studySubtype || !doctorName) && report.id) {
            try {
              const fullReport = JSON.parse(userStorageService.getItem(`krispoint_report_${report.id}`) || '{}');
              studySubtype = studySubtype || fullReport.study_subtype || '';
              doctorName = doctorName || fullReport.doctor_name || 'Unknown Doctor';
            } catch (e) {
              // Ignore errors, just use empty string/default
            }
          }
          
          return {
            id: report.id,
            name: report.patient_name,
            studyType: report.study_type,
            studySubtype: studySubtype,
            studyDate: report.study_date,
            doctorName: doctorName || 'Unknown Doctor',
            status: report.status,
            dateCreated: report.created_at,
            lastModified: report.last_modified,
            finalizedAt: report.finalized_at
          };
        })
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

      console.log('Listed reports from localStorage (fallback):', reports.length);
      return {
        success: true,
        reports: reports,
        count: reports.length
      };
    } catch (error) {
      console.error('Failed to list reports from localStorage:', error);
      return {
        success: false,
        reports: [],
        error: error.message
      };
    }
  }

  // localStorage fallback for loadReport
  async loadReportFromLocalStorage(reportId) {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }

      const reportKey = `krispoint_report_${reportId}`;
      const stored = userStorageService.getItem(reportKey);
      
      if (!stored) {
        throw new Error(`Report not found: ${reportId}`);
      }

      const report = JSON.parse(stored);
      
      // Convert back to our internal format
      const reportData = {
        content: report.content,
        status: report.status,
        lastModified: report.last_modified,
        finalizedAt: report.finalized_at,
        isDirty: false
      };

      const patientData = {
        name: report.patient_name,
        mrn: report.patient_id,
        age: report.patient_age,
        ageUnit: report.patient_age_unit || 'years',  // Age unit (days/months/years)
        gender: report.patient_gender || '',  // Map patient_gender back to gender
        examType: report.study_type,
        examSubtype: report.study_subtype || '',
        indication: report.indication || '',
        studyDate: report.study_date,
        accessionNumber: report.accession_number || '',
        specialistName: report.specialist_name || '',  // Specialist co-signer (for residents)
        specialistDesignation: report.specialist_designation || 'Radiologist'  // Specialist title
      };

      console.log('Report loaded from localStorage (fallback):', reportId);
      return {
        success: true,
        data: { reportData, patientData },
        report
      };
    } catch (error) {
      console.error('Failed to load report from localStorage:', error);
      throw new Error(`Failed to load report: ${error.message}`);
    }
  }

  // localStorage fallback for deleteReport
  async deleteReportFromLocalStorage(reportId) {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }

      // Remove the report data (user-specific)
      const reportKey = `krispoint_report_${reportId}`;
      userStorageService.removeItem(reportKey);
      
      // Update the index (user-specific)
      const reportsIndex = this.getLocalStorageReportsIndex();
      delete reportsIndex[reportId];
      userStorageService.setItem('krispoint_reports_index', JSON.stringify(reportsIndex));
      
      console.log('Report deleted from localStorage (fallback):', reportId);
      return {
        success: true,
        message: 'Report deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete report from localStorage:', error);
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  // Helper method to get/initialize reports index
  getLocalStorageReportsIndex() {
    try {
      if (!browser || typeof localStorage === 'undefined') {
        return {};
      }

      const stored = userStorageService.getItem('krispoint_reports_index');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get reports index from localStorage:', error);
      return {};
    }
  }
}

// Export singleton instance
export const fileStorageService = new FileStorageService();