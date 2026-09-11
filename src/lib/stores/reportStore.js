// reportStore.js - Main store for report data and UI state
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { settingsService } from '../services/SettingsService.js';
import { currentUser } from './authStore.js';

/**
 * Normalize report content spacing to prevent double spacing between sections.
 * This is needed because saved reports may have extra empty paragraphs from when
 * they were originally formatted, and we don't want those to stack with editor spacing.
 */
function normalizeReportSpacing(content) {
  if (!content) return '';
  
  // Remove multiple consecutive empty paragraphs (keep max one between sections)
  // Match patterns like: </p><p></p><p></p><p> or </p><p><br></p><p></p><p>
  let normalized = content;
  
  // First, collapse multiple empty paragraphs into a single one
  // Empty paragraph patterns: <p></p>, <p><br></p>, <p>&nbsp;</p>, <p> </p>
  const emptyParagraph = /<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>/gi;
  
  // Find sequences of 2+ empty paragraphs and replace with single empty paragraph
  let prevLength;
  do {
    prevLength = normalized.length;
    normalized = normalized.replace(
      /(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*){2,}/gi,
      '<p></p>'
    );
  } while (normalized.length !== prevLength);
  
  // Remove empty paragraphs at the very start
  normalized = normalized.replace(/^(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+/gi, '');
  
  // Remove empty paragraphs at the very end
  normalized = normalized.replace(/(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+$/gi, '');
  
  return normalized.trim();
}

// Patient data store
const initialPatientData = {
  name: '', // Combined name (for backward compatibility)
  firstName: '', // First name (for worklist integration)
  lastName: '', // Last name (for worklist integration)
  hospitalNumber: '', // Hospital Number (unique patient identifier)
  age: '',
  ageUnit: 'years', // 'days', 'months', or 'years'
  dateOfBirth: '', // Date of birth (alternative to age)
  gender: '',
  examType: '',
  examSubtype: '',
  indication: '',
  referringPhysician: '', // Doctor who requested the study
  studyDate: new Date().toISOString().split('T')[0],
  accessionNumber: '',
  priority: 'ROUTINE', // ROUTINE, URGENT, STAT
  // Specialist co-signer fields (for residents only)
  specialistName: '',
  specialistDesignation: 'Radiologist'
};

// Create patient data store
function createPatientDataStore() {
  const { subscribe, set, update } = writable(initialPatientData);

  return {
    subscribe,
    set,
    update,
    // Helper method to reset data
    reset: () => {
      set({
        ...initialPatientData,
        studyDate: new Date().toISOString().split('T')[0]
      });
    }
  };
}

export const patientData = createPatientDataStore();

// Report data store - simplified to single content field
const initialReportData = {
  content: '', // Single text field for all report content
  reportId: null, // Track the ID of the current report to prevent duplicates
  databaseReportId: null, // Track the database ID when loaded from worklist
  lastModified: null,
  isDirty: false,
  status: 'DRAFT', // 'DRAFT', 'SUBMITTED', 'SIGNED'
  lastSaved: null,
  finalizedAt: null,
  assignedSpecialistId: null, // ID of specialist assigned to review this report
  // Workflow signature info for PDF export
  createdBy: null, // User ID of the report creator - CRITICAL for PDF signature logic
  creatorInfo: null, // { id, fullName, designation, title, signatureUrl }
  signerInfo: null, // { id, fullName, designation, title, signatureUrl } - populated when report is signed
  reviewerInfo: null, // { id, fullName, designation, title, signatureUrl } - populated when report is co-signed by specialist
  signedBy: null,
  signedAt: null,
  reviewedBy: null
};

export const reportData = writable(initialReportData);

// Derived store for report status - allows reactive subscription
export const currentReportStatus = derived(
  reportData,
  ($reportData) => $reportData.status || 'DRAFT'
);

// Report metadata store - tracks ownership and permissions
const initialReportMeta = {
  isOwner: false,
  isAssignedSpecialist: false,
  isSigner: false,
  isReviewer: false,
  hasSpecialistReview: false,
  hasBeenSubmitted: false,   // Report was submitted at least once (can't release)
  currentUserId: null,
  canUndoSign: false,        // Can undo sign-off (within 15 mins, is signer)
  undoSignExpiresAt: null,   // When the undo window expires
  isReportAuthor: false
};

export const reportMeta = writable(initialReportMeta);

// Derived store for report interaction state - computes readOnly based on status and user context
export const reportInteractionState = derived(
  [reportData, reportMeta],
  ([$reportData, $reportMeta]) => {
    const status = $reportData.status || 'DRAFT';
    const isOwner = $reportMeta.isOwner;
    const isAssignedSpecialist = $reportMeta.isAssignedSpecialist;
    const isSigner = $reportMeta.isSigner;
    const isReviewer = $reportMeta.isReviewer;
    const canUndoSign = $reportMeta.canUndoSign;
    const undoSignExpiresAt = $reportMeta.undoSignExpiresAt;
    
    let readOnly = false;
    
    // SIGNED reports: always read-only (use "Undo Sign Off" to revert to DRAFT)
    if (status === 'SIGNED') {
      readOnly = true;
    }
    // SUBMITTED reports: only assigned specialist can edit
    else if (status === 'SUBMITTED') {
      readOnly = !isAssignedSpecialist;
    }
    // DRAFT reports: only owner can edit
    else if (status === 'DRAFT') {
      readOnly = !isOwner;
    }
    
    return {
      readOnly,
      isOwner,
      isAssignedSpecialist,
      isSigner,
      isReviewer,
      hasSpecialistReview: $reportMeta.hasSpecialistReview,
      hasBeenSubmitted: $reportMeta.hasBeenSubmitted,
      canUndoSign,
      undoSignExpiresAt,
      status
    };
  }
);

// UI state store - simplified without section-specific state
const initialUIState = {
  isListening: false,
  showMacroPanel: false,
  showVoiceWave: false,
  isReportStarted: false,
  sidebarCollapsed: true,
  lastCommand: null,
  errors: [],
  showPatientModal: false,
  notification: null, // { type: 'success'|'error'|'info', message: 'text', timestamp: Date }
  activeSection: 'comparison' // Track current section for voice navigation
};

export const uiState = writable(initialUIState);

// Derived store to check if patient data is complete
export const hasCompletePatientData = derived(
  patientData,
  ($patientData) => {
    return $patientData.name && 
           $patientData.hospitalNumber &&
           $patientData.examType && 
           $patientData.examSubtype;
  }
);

// Patient actions
export const patientActions = {
  updateField(field, value) {
    patientData.update(data => ({
      ...data,
      [field]: value
    }));
  },

  setExamType(examType) {
    patientData.update(data => ({
      ...data,
      examType,
      examSubtype: '' // Reset subtype when type changes
    }));
  },

  setExamSubtype(examSubtype) {
    patientData.update(data => ({
      ...data,
      examSubtype
    }));
  },

  validateRequiredFields(userDesignation = null) {
    let errors = [];
    
    patientData.subscribe(data => {
      if (!data.firstName?.trim()) {
        errors.push('First name is required');
      }
      if (!data.lastName?.trim()) {
        errors.push('Last name is required');
      }
      if (!data.hospitalNumber?.trim()) {
        errors.push('Hospital Number is required');
      }
      if (!data.gender?.trim()) {
        errors.push('Sex is required');
      }
      if (!data.examType) {
        errors.push('Modality is required');
      }
      if (!data.examSubtype) {
        errors.push('Body region is required');
      }
      // Validate specialist name for residents
      if (userDesignation === 'Resident' && !data.specialistName?.trim()) {
        errors.push('Specialist name is required for resident reports');
      }
    })();

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  reset() {
    patientData.set(initialPatientData);
  }
};

// Report actions - simplified for single content field
export const reportActions = {
  updateContent(content) {
    reportData.update(data => ({
      ...data,
      content,
      lastModified: new Date().toISOString(),
      isDirty: true
    }));
  },

  setDatabaseReportId(id, updatedAt = null) {
    reportData.update(data => ({
      ...data,
      databaseReportId: id,
      // Store the version timestamp for optimistic concurrency control
      lastSaved: updatedAt || new Date().toISOString(),
      lastModified: updatedAt || new Date().toISOString()
    }));
  },
  
  setReportStatus(status) {
    reportData.update(data => ({
      ...data,
      status
    }));
  },
  
  setAssignedSpecialistId(specialistId) {
    reportData.update(data => ({
      ...data,
      assignedSpecialistId: specialistId
    }));
  },
  
  setReportMeta(meta) {
    reportMeta.update(current => ({
      ...current,
      ...meta
    }));
  },
  
  resetReportMeta() {
    reportMeta.set(initialReportMeta);
  },

  appendContent(content) {
    reportData.update(data => ({
      ...data,
      content: (data.content || '') + (data.content ? '\n\n' : '') + content,
      lastModified: new Date().toISOString(),
      isDirty: true
    }));
  },

  insertMacro(macroText) {
    reportData.update(data => ({
      ...data,
      content: (data.content || '') + (data.content ? '\n\n' : '') + macroText,
      lastModified: new Date().toISOString(),
      isDirty: true
    }));
  },

  clearContent() {
    reportData.update(data => ({
      ...data,
      content: '',
      lastModified: new Date().toISOString(),
      isDirty: true
    }));
  },

  newReport() {
    let initialContent = '';
    let initialPatient = initialPatientData;
    
    // Start with blank content - users can choose templates via voice commands or the template picker
    // Templates are now stored in the database and managed by administrators
    
    // Set the report data
    reportData.set({
      content: initialContent,
      reportId: null, // Reset report ID for new reports
      lastModified: new Date().toISOString(),
      isDirty: false,
      status: 'draft', // Always start new reports as draft
      lastSaved: null,
      finalizedAt: null
    });
    
    // Set patient data (with potential template values)
    patientData.set(initialPatient);
    
    // Reset UI state
    uiState.update(state => ({
      ...state,
      isReportStarted: false
    }));
  },

  clearReport() {
    // Create fresh copies to prevent data contamination between reports
    reportData.set({
      ...initialReportData,
      lastModified: null,
      lastSaved: null
    });
    patientData.set({
      ...initialPatientData,
      studyDate: new Date().toISOString().split('T')[0] // Fresh date for new reports
    });
    reportMeta.set({ ...initialReportMeta, isOwner: true }); // New reports are owned by creator
  },

  async loadFromStorage(reportId) {
    if (!reportId) {
      console.warn('No report ID provided for loading');
      return null;
    }

    try {
      // Use query param for Windows compatibility (SvelteKit [id] routing issue)
      const res = await fetch(`/api/reports?id=${reportId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch report from database');
      }
      
      const data = await res.json();
      
      if (data.success && data.report) {
        const dbReport = data.report;
        
        // Use content field directly if available, otherwise fallback to parsed fields
        let contentToLoad = dbReport.content || '';
        if (!contentToLoad) {
          const contentParts = [];
          if (dbReport.technique) contentParts.push(`TECHNIQUE:\n${dbReport.technique}`);
          if (dbReport.comparison) contentParts.push(`COMPARISON:\n${dbReport.comparison}`);
          if (dbReport.findings) contentParts.push(`FINDINGS:\n${dbReport.findings}`);
          if (dbReport.impressions) contentParts.push(`IMPRESSION:\n${dbReport.impressions}`);
          if (dbReport.recommendations) contentParts.push(`RECOMMENDATIONS:\n${dbReport.recommendations}`);
          contentToLoad = contentParts.join('\n\n');
        }
        
        // Normalize spacing to prevent double-spacing between sections
        contentToLoad = normalizeReportSpacing(contentToLoad);
        
        reportData.set({
          content: contentToLoad,
          databaseReportId: dbReport.id,
          reportId: reportId,
          lastModified: dbReport.updatedAt || new Date().toISOString(),
          isDirty: false,
          status: dbReport.status || 'DRAFT',
          lastSaved: dbReport.updatedAt || null,
          finalizedAt: dbReport.status === 'SIGNED' ? dbReport.updatedAt : null,
          assignedSpecialistId: dbReport.assignedSpecialistId || null,
          // Workflow signature info for PDF export
          createdBy: dbReport.createdBy || null, // CRITICAL for PDF dual signature logic
          creatorInfo: dbReport.creatorInfo || null,
          signerInfo: dbReport.signerInfo || null,
          reviewerInfo: dbReport.reviewerInfo || null,
          signedBy: dbReport.signedBy || null,
          signedAt: dbReport.signedAt || null,
          reviewedBy: dbReport.reviewedBy || null
        });
        
        patientData.set({
          name: dbReport.patientData?.name || '',
          hospitalNumber: dbReport.patientData?.hospitalNumber || '',
          age: dbReport.patientAge || dbReport.patientData?.age || '',
          ageUnit: dbReport.patientAgeUnit || dbReport.patientData?.ageUnit || 'years',
          dateOfBirth: dbReport.patientData?.dateOfBirth || '',
          gender: dbReport.patientData?.gender || '',
          examType: dbReport.patientData?.examType || dbReport.modality || '',
          examSubtype: dbReport.patientData?.examSubtype || dbReport.bodyRegion || '',
          indication: dbReport.patientData?.indication || '',
          referringPhysician: dbReport.patientData?.referringPhysician || '',
          studyDate: dbReport.patientData?.studyDate || new Date().toISOString().split('T')[0],
          accessionNumber: dbReport.accessionNumber || '',
          specialistName: '',
          specialistDesignation: 'Radiologist'
        });
        
        // CRITICAL: Update reportMeta with ownership/participation info from API
        // This enables proper save permissions for draft reports
        reportMeta.set({
          isOwner: dbReport.isOwner || false,
          isAssignedSpecialist: dbReport.isAssignedSpecialist || false,
          isSigner: dbReport.isSigner || false,
          isReviewer: dbReport.isReviewer || false,
          hasSpecialistReview: !!dbReport.reviewedBy,
          currentUserId: null, // Will be set by component if needed
          canUndoSign: dbReport.canUndoSign || false,
          undoSignExpiresAt: dbReport.undoSignExpiresAt || null
        });
        
        console.log('Report loaded successfully from database:', reportId, 'isOwner:', dbReport.isOwner);
        return { success: true, data: { report: dbReport } };
      } else {
        throw new Error('Failed to load report data');
      }
    } catch (error) {
      console.error('Error loading report from database:', error);
      
      uiState.update(state => ({
        ...state,
        notification: {
          type: 'error',
          message: `Failed to load report: ${error.message}`,
          timestamp: Date.now()
        }
      }));
      
      return null;
    }
  },

  async saveToStorage() {
    try {
      const currentReportData = get(reportData);
      const currentPatientData = get(patientData);
      
      // If in browser, use database storage (auth is handled via cookies)
      if (browser) {
        // If this report has a database ID, update it
        if (currentReportData.databaseReportId) {
          return await this.saveToDatabase(currentReportData, currentPatientData);
        }
        
        // Otherwise, create a new report in the database
        return await this.createReportInDatabase(currentReportData, currentPatientData);
      }
      
      // Fallback to localStorage for non-authenticated users (shouldn't happen in server mode)
      console.warn('No session token, cannot save to database');
      return false;
    } catch (error) {
      console.error('Failed to save report:', error);
      return false;
    }
  },
  
  async createReportInDatabase(currentReportData, currentPatientData) {
    try {
      // CRITICAL: Require valid hospital number before creating report
      // This prevents orphaned patients with temporary IDs
      const hospitalNumber = currentPatientData.hospitalNumber?.trim();
      if (!hospitalNumber || hospitalNumber.startsWith('TMP-')) {
        console.log('Skipping database create: missing or invalid hospital number. Use the patient form to enter proper patient info.');
        return false;
      }
      
      // Also require essential patient info
      const firstName = currentPatientData.firstName?.trim();
      const lastName = currentPatientData.lastName?.trim();
      const patientName = currentPatientData.name?.trim();
      if (!patientName && !firstName && !lastName) {
        console.log('Skipping database create: missing patient name');
        return false;
      }
      
      // Parse the content to extract structured fields
      const parsedFields = this.parseContentToFields(currentReportData.content || '');
      
      const createPayload = {
        patientName: patientName || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown Patient',
        hospitalNumber: hospitalNumber,
        gender: currentPatientData.gender || null,
        dateOfBirth: currentPatientData.dateOfBirth || null,
        age: currentPatientData.age || null,
        ageUnit: currentPatientData.ageUnit || 'years',
        modality: currentPatientData.examType || 'OTHER',
        bodyRegion: currentPatientData.examSubtype || null,
        studyDate: currentPatientData.studyDate || new Date().toISOString().split('T')[0],
        indication: currentPatientData.indication || '',
        content: currentReportData.content || '',
        technique: parsedFields.technique,
        comparison: parsedFields.comparison,
        findings: parsedFields.findings,
        impressions: parsedFields.impressions,
        recommendations: parsedFields.recommendations,
        status: currentReportData.status === 'finalized' ? 'SIGNED' : 'DRAFT'
      };
      
      console.log('Creating new report in database with payload:', createPayload);
      
      const res = await fetch('/api/reports', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Database create failed:', errorText);
        return false;
      }
      
      const result = await res.json();
      
      if (result.success && result.report?.id) {
        // Update local state with the new database ID
        reportData.update(data => ({
          ...data,
          databaseReportId: result.report.id
        }));
        console.log('New report created in database with ID:', result.report.id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating report in database:', error);
      return false;
    }
  },
  
  async saveToDatabase(currentReportData, currentPatientData) {
    try {
      // Check the report status
      const currentMeta = get(reportMeta);
      const currentStatus = (currentReportData.status || 'DRAFT').toUpperCase();
      const isOwner = currentMeta.isOwner;
      const isAssignedSpecialist = currentMeta.isAssignedSpecialist;
      
      // SIGNED reports: always read-only, use "Undo Sign Off" to revert to DRAFT first
      if (currentStatus === 'SIGNED') {
        console.log('Skipping save: SIGNED reports are read-only');
        return true;
      }
      
      // SUBMITTED reports: only assigned specialist can save
      if (currentStatus === 'SUBMITTED') {
        if (!isAssignedSpecialist) {
          console.log('Skipping save: SUBMITTED report - not assigned specialist');
          return true;
        }
        console.log('Allowing save for SUBMITTED report: is assigned specialist');
      }
      
      // DRAFT reports: only owner can save
      if (currentStatus === 'DRAFT') {
        if (!isOwner) {
          console.log('Skipping save: DRAFT report - not owner');
          return true;
        }
        console.log('Allowing save for DRAFT report: is owner');
      }
      
      // Save raw content directly - preserves template formatting
      // Only save content updates for DRAFT reports
      // CRITICAL: Only include patient data fields if they have valid values
      // This prevents overwriting existing data when patientData store is temporarily empty (during report loading)
      const updatePayload = {
        content: currentReportData.content || '',
        // Optimistic concurrency control: include last known version to detect conflicts
        ifMatchVersion: currentReportData.lastSaved || currentReportData.lastModified
        // Note: Don't include status - let workflow APIs control status transitions
      };
      
      // Only include patient fields if they have non-empty values
      // This prevents clearing existing data when the store is in initial/empty state
      if (currentPatientData.indication?.trim()) {
        updatePayload.indication = currentPatientData.indication;
      }
      if (currentPatientData.age && currentPatientData.age !== '') {
        updatePayload.age = currentPatientData.age;
        updatePayload.ageUnit = currentPatientData.ageUnit || 'years';
      }
      if (currentPatientData.examSubtype?.trim()) {
        updatePayload.bodyRegion = currentPatientData.examSubtype;
      }
      if (currentPatientData.examType?.trim()) {
        updatePayload.modality = currentPatientData.examType;
      }
      if (currentPatientData.referringPhysician?.trim()) {
        updatePayload.referringPhysician = currentPatientData.referringPhysician;
      }
      
      // Use query param for Windows compatibility (SvelteKit [id] routing issue)
      const res = await fetch(`/api/reports?id=${currentReportData.databaseReportId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Database save failed:', errorData);
        return false;
      }
      
      const result = await res.json();
      
      // Update the version timestamp after successful save for future concurrency checks
      if (result.success && result.report?.updatedAt) {
        reportData.update(data => ({
          ...data,
          lastSaved: result.report.updatedAt,
          lastModified: result.report.updatedAt
        }));
      }
      
      return result.success;
    } catch (error) {
      console.error('Error saving to database:', error);
      return false;
    }
  },
  
  parseContentToFields(content) {
    const fields = {
      technique: '',
      comparison: '',
      findings: '',
      impressions: '',
      recommendations: ''
    };
    
    if (!content) return fields;
    
    // Convert HTML to plain text for parsing
    const textContent = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    
    // Parse sections using regex
    const sectionPatterns = [
      { key: 'technique', pattern: /TECHNIQUE:\s*([\s\S]*?)(?=(?:COMPARISON:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i },
      { key: 'comparison', pattern: /COMPARISON:\s*([\s\S]*?)(?=(?:TECHNIQUE:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i },
      { key: 'findings', pattern: /FINDINGS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|IMPRESSION:|RECOMMENDATIONS:|$))/i },
      { key: 'impressions', pattern: /IMPRESSION:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|RECOMMENDATIONS:|$))/i },
      { key: 'recommendations', pattern: /RECOMMENDATIONS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|IMPRESSION:|$))/i }
    ];
    
    for (const { key, pattern } of sectionPatterns) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        fields[key] = match[1].trim();
      }
    }
    
    // If no sections were found, store the entire content in findings as fallback
    const hasContent = Object.values(fields).some(v => v.trim() !== '');
    if (!hasContent && textContent.trim()) {
      fields.findings = textContent.trim();
    }
    
    return fields;
  },

  async saveDraft() {
    // Don't change status if already in workflow state (SUBMITTED, SIGNED, finalized)
    // These states should only be changed by workflow actions, not autosave
    const currentData = get(reportData);
    const currentMeta = get(reportMeta);
    const currentStatus = (currentData.status || 'DRAFT').toUpperCase();
    
    // SIGNED reports: always read-only, use "Undo Sign Off" to revert first
    if (currentStatus === 'SIGNED') {
      console.log('Skipping saveDraft: SIGNED reports are read-only');
      reportData.update(data => ({ ...data, isDirty: false }));
      return true;
    }
    
    // SUBMITTED reports: only assigned specialist can save
    if (currentStatus === 'SUBMITTED') {
      if (!currentMeta.isAssignedSpecialist) {
        console.log('Skipping saveDraft: SUBMITTED report - not assigned specialist');
        reportData.update(data => ({ ...data, isDirty: false }));
        return true;
      }
      // Specialist can save
      const success = await this.saveToStorage();
      if (success) {
        reportData.update(data => ({ ...data, isDirty: false, lastSaved: new Date().toISOString() }));
      }
      return success;
    }
    
    // DRAFT reports: only owner can save
    if (currentStatus === 'DRAFT' && !currentMeta.isOwner) {
      console.log('Skipping saveDraft: DRAFT report - not owner');
      reportData.update(data => ({ ...data, isDirty: false }));
      return true;
    }
    
    // Proceed with save for DRAFT owner
    reportData.update(data => ({
      ...data,
      status: data.status === 'finalized' ? 'finalized' : 'DRAFT',
      isDirty: true
    }));
    
    const success = await this.saveToStorage();
    if (success) {
      reportData.update(data => ({ ...data, isDirty: false, lastSaved: new Date().toISOString() }));
    }
    return success;
  },

  async finalizeReport() {
    // First update status to 'finalized' BEFORE saving
    reportData.update(data => ({
      ...data,
      status: 'finalized',
      finalizedAt: new Date().toISOString(),
      isDirty: true  // Mark as dirty so it gets saved
    }));
    
    // Now save with the finalized status
    const success = await this.saveToStorage();
    if (success) {
      reportData.update(data => ({
        ...data,
        isDirty: false,
        lastSaved: new Date().toISOString()
      }));
    }
    return success;
  },

  reset() {
    reportData.set(initialReportData);
  },

  save() {
    // Legacy method - defaults to draft save
    return this.saveDraft();
  },

  // Legacy method for backward compatibility - converts section-based calls to content updates
  updateSection(section, content) {
    // For templates that expect sections, we'll format them nicely
    const sectionHeaders = {
      comparison: 'COMPARISON:',
      technique: 'TECHNIQUE:',
      findings: 'FINDINGS:',
      impression: 'IMPRESSION:'
    };
    
    const formattedContent = sectionHeaders[section] 
      ? `${sectionHeaders[section]}\n${content}\n\n`
      : content;
    
    this.appendContent(formattedContent);
  }
};

// UI actions
export const uiActions = {
  setListening(isListening) {
    uiState.update(state => ({ ...state, isListening }));
  },

  toggleMacroPanel() {
    uiState.update(state => ({ 
      ...state, 
      showMacroPanel: !state.showMacroPanel 
    }));
  },

  showMacroPanel() {
    uiState.update(state => ({ 
      ...state, 
      showMacroPanel: true 
    }));
  },

  hideMacroPanel() {
    uiState.update(state => ({ 
      ...state, 
      showMacroPanel: false 
    }));
  },

  showPatientModal() {
    uiState.update(state => ({ 
      ...state, 
      showPatientModal: true 
    }));
  },

  hidePatientModal() {
    uiState.update(state => ({ 
      ...state, 
      showPatientModal: false 
    }));
  },

  toggleSidebar() {
    uiState.update(state => ({ 
      ...state, 
      sidebarCollapsed: !state.sidebarCollapsed 
    }));
  },

  recordCommand(command) {
    uiState.update(state => ({
      ...state,
      lastCommand: command
    }));
  },

  showNotification(type, message) {
    uiState.update(state => ({
      ...state,
      notification: {
        type,
        message,
        timestamp: Date.now()
      }
    }));

    // Auto-hide after 4 seconds
    setTimeout(() => {
      uiActions.hideNotification();
    }, 4000);
  },

  hideNotification() {
    uiState.update(state => ({
      ...state,
      notification: null
    }));
  },

  showSuccessNotification(message) {
    this.showNotification('success', message);
  },

  showErrorNotification(message) {
    this.showNotification('error', message);
  },

  showInfoNotification(message) {
    this.showNotification('info', message);
  },

  setCurrentSection(section) {
    // Update the active section in UI state for proper navigation
    uiState.update(state => ({
      ...state,
      activeSection: section
    }));
    console.log(`Current section updated to: ${section}`);
  }
};