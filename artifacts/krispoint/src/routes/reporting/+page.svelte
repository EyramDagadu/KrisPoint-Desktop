<!-- src/routes/reporting/+page.svelte -->
<script>
  import ReportWorkspace from '$lib/components/reporting/ReportWorkspace.svelte';
  import { patientData, reportData, reportActions, uiActions, hasCompletePatientData, reportInteractionState } from '$lib/stores/reportStore.js';
  import { get } from 'svelte/store';
  import { sanitizeHTML, htmlToText } from '$lib/utils/htmlSanitizer.js';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { editionCapabilities } from '$lib/config/edition';
  
  let isInitialized = false;
  let isLoadingReport = true;
  let currentlyLoadingReportId = null;
  
  let presenceInterval = null;
  let lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
  let hasLock = false;
  const HEARTBEAT_INTERVAL = 15000;
  
  // Reactive bindings from the interaction state store
  $: readOnly = $reportInteractionState.readOnly;
  $: reportStatus = $reportInteractionState.status;
  $: isAssignedSpecialist = $reportInteractionState.isAssignedSpecialist;
  $: isOwner = $reportInteractionState.isOwner;
  $: isSigner = $reportInteractionState.isSigner;
  $: isReviewer = $reportInteractionState.isReviewer;
  $: hasSpecialistReview = $reportInteractionState.hasSpecialistReview;
  $: hasBeenSubmitted = $reportInteractionState.hasBeenSubmitted;
  $: canUndoSign = $reportInteractionState.canUndoSign;
  $: undoSignExpiresAt = $reportInteractionState.undoSignExpiresAt;
  
  // Check URL parameters for new report intent and load ID
  $: isNewReport = $page.url.searchParams.has('new');
  $: loadReportId = $page.url.searchParams.get('loadId');
  $: reportIdFromWorklist = $page.url.searchParams.get('reportId');
  $: templateCategory = $page.url.searchParams.get('template');
  $: templateType = $page.url.searchParams.get('type');
  
  /**
   * Convert plain text to HTML paragraphs
   * Handles line breaks and creates proper paragraph structure for TipTap
   */
  function convertTextToHtml(text) {
    if (!text) return '';
    
    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map(para => {
      // Replace single newlines with <br> within paragraphs
      const withBreaks = para.trim().replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    }).join('');
  }
  
  /**
   * Parse template content and rebuild with consistent section spacing
   * Ensures exactly one blank line between sections, no blank line before first section
   * Works for both fresh templates AND saved reports (idempotent)
   */
  function formatTemplateContent(content) {
    if (!content) return '';
    
    let result = content.trim();
    
    // Section headers in order they typically appear
    const sectionHeaders = ['COMPARISON:', 'TECHNIQUE:', 'FINDINGS:', 'IMPRESSION:', 'RECOMMENDATIONS:'];
    
    // Find which section appears first in the content
    let firstSectionIndex = -1;
    let firstSectionPos = Infinity;
    
    for (let i = 0; i < sectionHeaders.length; i++) {
      const header = sectionHeaders[i];
      const pos = result.indexOf(`<strong>${header}</strong>`);
      if (pos !== -1 && pos < firstSectionPos) {
        firstSectionPos = pos;
        firstSectionIndex = i;
      }
    }
    
    // For each section header (except the first), normalize spacing:
    // 1. First REMOVE any existing empty paragraphs before it
    // 2. Then add exactly ONE empty paragraph
    for (let i = 0; i < sectionHeaders.length; i++) {
      if (i === firstSectionIndex) continue; // Skip first section
      
      const header = sectionHeaders[i];
      
      // Remove all empty paragraphs immediately before this section header
      // Pattern: one or more empty paragraphs followed by the section header
      const emptyParaPattern = new RegExp(
        `((<p>(<br\\s*\\/?>|&nbsp;|\\s)*<\\/p>)+)(<p><strong>${header}</strong>)`,
        'gi'
      );
      result = result.replace(emptyParaPattern, '$4'); // Keep only the section header
      
      // Now add exactly one empty paragraph before this section
      result = result.replace(
        new RegExp(`<p><strong>${header}</strong>`, 'g'),
        `<p></p><p><strong>${header}</strong>`
      );
    }
    
    // Also remove any leading empty paragraphs at start
    result = result.replace(/^(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>)+/gi, '');
    
    return result;
  }
  
  async function loadReportFromServer(reportId) {
    try {
      console.log('loadReportFromServer called with ID:', reportId);
      
      const apiUrl = `/api/reports?id=${reportId}`;
      console.log('Fetching from:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('API response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        return false;
      }
      
      const data = await res.json();
      console.log('API response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.report) {
        reportActions.clearReport();
        
        // Set status in store
        const status = data.report.status || 'DRAFT';
        reportActions.setReportStatus(status);
        reportData.update(current => ({
          ...current,
          activeTemplateId: data.report.activeTemplateId ?? null,
          activeTemplateName: data.report.activeTemplateName ?? null
        }));
        
        // Set report metadata in store (drives readOnly and isAssignedSpecialist reactively)
        // CRITICAL: Use nullish coalescing (??) to preserve true values from clearReport()
        // Using || false would overwrite isOwner to false when API returns undefined
        const computedHasBeenSubmitted = data.report.submittedAt !== null && data.report.submittedAt !== undefined;
        console.log('[page.svelte] Loading report metadata. submittedAt =', data.report.submittedAt, 'computed hasBeenSubmitted =', computedHasBeenSubmitted);
        reportActions.setReportMeta({
          isOwner: data.report.isOwner ?? true,
          isAssignedSpecialist: data.report.isAssignedSpecialist ?? false,
          isSigner: data.report.isSigner ?? false,
          isReviewer: data.report.isReviewer ?? false,
          hasSpecialistReview: data.report.reviewedBy !== null,
          hasBeenSubmitted: computedHasBeenSubmitted,
          canUndoSign: data.report.canUndoSign ?? false,
          undoSignExpiresAt: data.report.undoSignExpiresAt ?? null,
          isReportAuthor: data.report.isReportAuthor ?? false
        });
        
        // Store workflow signature info for PDF export
        reportData.update(rd => ({
          ...rd,
          createdBy: data.report.createdBy || null,
          creatorInfo: data.report.creatorInfo || null,
          signerInfo: data.report.signerInfo || null,
          reviewerInfo: data.report.reviewerInfo || null,
          signedBy: data.report.signedBy || null,
          signedAt: data.report.signedAt || null,
          reviewedBy: data.report.reviewedBy || null
        }));
        
        // Keep gender code as uppercase M/F to match dropdown values
        let gender = (data.report.patientData.gender || '').toUpperCase();
        if (gender !== 'M' && gender !== 'F') {
          // Try to convert full words to codes
          const genderLower = (data.report.patientData.gender || '').toLowerCase();
          if (genderLower === 'male') gender = 'M';
          else if (genderLower === 'female') gender = 'F';
          else gender = '';
        }
        
        // CRITICAL: Use stored age first, only calculate from DOB if age is not stored
        // This prevents overwriting manually-entered age values
        let age = '';
        let ageUnit = data.report.patientData.ageUnit || 'years';
        const dob = data.report.patientData.dateOfBirth;
        const storedAge = data.report.patientAge || data.report.patientData?.age;
        const storedAgeUnit = data.report.patientAgeUnit || data.report.patientData?.ageUnit || 'years';
        
        if (storedAge !== null && storedAge !== undefined && storedAge !== '') {
          // Prioritize stored age - this was manually entered by user
          age = String(storedAge);
          ageUnit = storedAgeUnit;
        } else if (dob && dob !== '0001-01-01' && dob !== '') {
          // Only calculate from DOB if no stored age exists
          const birthDate = new Date(dob);
          const today = new Date();
          if (!isNaN(birthDate.getTime())) {
            const ageInYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            if (ageInYears >= 1) {
              age = String(ageInYears);
              ageUnit = 'years';
            } else {
              const ageInMonths = Math.floor((today - birthDate) / (30.44 * 24 * 60 * 60 * 1000));
              age = String(ageInMonths);
              ageUnit = 'months';
            }
          }
        }
        
        // Split combined name into firstName/lastName for the form
        const fullName = data.report.patientData.name || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Map display modality names to dropdown values
        const modalityToDropdown = {
          'ct': 'ct', 'mri': 'mri', 'x-ray': 'xray', 'xray': 'xray', 
          'ultrasound': 'us', 'us': 'us', 'mammography': 'mg', 'mg': 'mg',
          'fluoroscopy': 'fl', 'fl': 'fl', 'nuclear medicine': 'nm', 'nm': 'nm',
          'pet-ct': 'petct', 'petct': 'petct'
        };
        const rawModality = (data.report.patientData.examType || '').toLowerCase();
        const examType = modalityToDropdown[rawModality] || rawModality;
        
        // CRITICAL: Use stored values from report object first, fall back to patientData nested object
        const bodyRegion = data.report.bodyRegion || data.report.patientData?.examSubtype || '';
        const referringPhysician = data.report.patientData?.referringPhysician || '';
        const indication = data.report.indication || data.report.patientData?.indication || '';
        
        patientData.set({
          name: fullName,
          firstName: firstName,
          lastName: lastName,
          hospitalNumber: data.report.patientData.hospitalNumber || '',
          age: age,
          ageUnit: ageUnit,
          dateOfBirth: dob || '',
          gender: gender,
          examType: examType,
          examSubtype: bodyRegion,
          indication: indication,
          referringPhysician: referringPhysician,
          studyDate: data.report.patientData.studyDate || new Date().toISOString().split('T')[0],
          accessionNumber: data.report.accessionNumber || '',
          specialistName: '',
          specialistDesignation: 'Radiologist'
        });
        
        // Use content field - format with consistent section spacing
        if (data.report.content) {
          console.log('[DEBUG] Report content BEFORE formatting:', data.report.content);
          const formatted = formatTemplateContent(data.report.content);
          console.log('[DEBUG] Report content AFTER formatting:', formatted);
          reportActions.updateContent(formatted);
        } else if (data.report.findings || data.report.impressions || data.report.technique || data.report.comparison || data.report.recommendations) {
          // Fallback to structured fields for legacy reports
          let htmlContent = '';
          
          if (data.report.technique) {
            htmlContent += `<p><strong>TECHNIQUE:</strong></p>`;
            htmlContent += convertTextToHtml(data.report.technique);
          }
          if (data.report.comparison) {
            htmlContent += `<p><strong>COMPARISON:</strong></p>`;
            htmlContent += convertTextToHtml(data.report.comparison);
          }
          if (data.report.findings) {
            htmlContent += `<p><strong>FINDINGS:</strong></p>`;
            htmlContent += convertTextToHtml(data.report.findings);
          }
          if (data.report.impressions) {
            htmlContent += `<p><strong>IMPRESSION:</strong></p>`;
            htmlContent += convertTextToHtml(data.report.impressions);
          }
          if (data.report.recommendations) {
            htmlContent += `<p><strong>RECOMMENDATIONS:</strong></p>`;
            htmlContent += convertTextToHtml(data.report.recommendations);
          }
          
          if (htmlContent.trim()) {
            reportActions.updateContent(htmlContent.trim());
          }
        }
        
        // Set database report ID with version timestamp for optimistic concurrency control
        // This prevents 409 Conflict errors when saving after status changes (return/submit)
        reportActions.setDatabaseReportId(reportId, data.report.updatedAt);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading report from server:', error);
      return false;
    }
  }
  
  /**
   * Load template from database and apply its structured sections
   */
  async function loadDbTemplateAndApply(templateId) {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.error('Failed to fetch template');
        return false;
      }
      
      const data = await res.json();
      if (!data.success || !data.template) {
        console.error('Template not found');
        return false;
      }
      
      const template = data.template;
      
      // Clear report and start fresh
      reportActions.clearReport();
      reportActions.setActiveTemplate(template);
      
      // Build content from separate section fields (preferred) or fallback to content field
      let htmlContent = '';
      
      if (template.comparisonHtml || template.techniqueHtml || template.findingsHtml || template.impressionHtml) {
        // Build sections with consistent spacing
        // First section: no leading space
        // Subsequent sections: one empty paragraph before for visual separation
        const sections = [];
        
        if (template.comparisonHtml) {
          sections.push(buildSection('COMPARISON:', template.comparisonHtml));
        }
        if (template.techniqueHtml) {
          sections.push(buildSection('TECHNIQUE:', template.techniqueHtml));
        }
        if (template.findingsHtml) {
          sections.push(buildSection('FINDINGS:', template.findingsHtml));
        }
        if (template.impressionHtml) {
          sections.push(buildSection('IMPRESSION:', template.impressionHtml));
        }
        
        // Join: first section directly, subsequent with blank line separator
        htmlContent = sections.map((section, i) => {
          return i === 0 ? section : `<p></p>${section}`;
        }).join('');
        
        if (htmlContent) {
          reportActions.updateContent(htmlContent);
        }
      } else if (template.content) {
        // Single content field - format with consistent section spacing
        const formatted = formatTemplateContent(template.content);
        if (formatted) {
          reportActions.updateContent(formatted);
        }
      }
      
      return { success: true, name: template.name };
    } catch (error) {
      console.error('Error loading database template:', error);
      return false;
    }
  }
  
  // Handle client-side navigation - check for SIGNED reports and clear them
  afterNavigate(({ to }) => {
    if (!browser) return;
    
    // Only handle navigation to this page without special parameters
    const hasParams = to?.url?.searchParams?.has('reportId') || 
                     to?.url?.searchParams?.has('dbTemplateId') ||
                     to?.url?.searchParams?.has('new') ||
                     to?.url?.searchParams?.has('template') ||
                     to?.url?.searchParams?.has('loadId');
    
    if (!hasParams) {
      const currentReportData = get(reportData);
      const currentStatus = (currentReportData?.status || '').toUpperCase();
      
      // If there's a SIGNED report in memory, clear it and show patient modal
      if (currentStatus === 'SIGNED') {
        reportActions.clearReport();
        uiActions.showPatientModal();
      }
    }
  });
  
  onMount(async () => {
    if (!browser) return;
    
    try {
      // Get URL parameters directly in onMount for reliability
      const urlParams = new URLSearchParams(window.location.search);
      const reportIdParam = urlParams.get('reportId');
      const dbTemplateIdParam = urlParams.get('dbTemplateId');
      const templateCategoryParam = urlParams.get('template');
      const templateTypeParam = urlParams.get('type');
      const loadIdParam = urlParams.get('loadId');
      const isNewParam = urlParams.has('new');
      
      // Handle database template application
      if (dbTemplateIdParam) {
        console.log('Loading database template:', dbTemplateIdParam);
        
        const result = await loadDbTemplateAndApply(parseInt(dbTemplateIdParam));
        
        if (result && result.success) {
          uiActions.showSuccessNotification(`Applied ${result.name} template`);
        } else {
          uiActions.showErrorNotification('Failed to load template');
        }
        
        // Clear patient data before showing modal for new template-based report
        reportActions.clearReport();
        
        // Show patient modal to fill in patient details
        uiActions.showPatientModal();
        
        // Clear the dbTemplateId parameter from URL
        const url = new URL(window.location);
        url.searchParams.delete('dbTemplateId');
        window.history.replaceState({}, '', url);
        
        isInitialized = true;
        isLoadingReport = false;
        return;
      }
      
      // Handle report loaded from worklist pickup
      if (reportIdParam) {
        const reportIdInt = parseInt(reportIdParam);
        
        // Prevent double loading of same report
        if (currentlyLoadingReportId === reportIdInt) {
          console.log('Already loading report:', reportIdInt);
          return;
        }
        currentlyLoadingReportId = reportIdInt;
        
        console.log('Loading report from worklist pickup:', reportIdParam);
        
        const loaded = await loadReportFromServer(reportIdInt);
        currentlyLoadingReportId = null;
        
        if (loaded) {
          uiActions.showSuccessNotification('Report loaded from worklist');
        } else {
          uiActions.showErrorNotification('Failed to load report from worklist');
          reportActions.clearReport();
          uiActions.showPatientModal();
        }
        
        const url = new URL(window.location);
        url.searchParams.delete('reportId');
        window.history.replaceState({}, '', url);
        
        isInitialized = true;
        isLoadingReport = false;
        return;
      }
      
      // Handle template application from URL parameters
      if (templateCategoryParam && templateTypeParam) {
        console.log('Applying template from URL:', templateCategoryParam, templateTypeParam);
        
        try {
          // Fetch templates from database
          const response = await fetch('/api/templates?scope=system', { credentials: 'include' });
          if (!response.ok) throw new Error('Failed to fetch templates');
          
          const data = await response.json();
          if (!data.success || !data.templates) throw new Error('No templates found');
          
          // Find matching template by category/modality and body region/type
          const searchCategory = templateCategoryParam.toLowerCase();
          const searchType = templateTypeParam.toLowerCase();
          
          // Try to find best matching template
          const dbTemplate = data.templates.find(t => {
            const category = (t.category || t.modality || '').toLowerCase();
            const bodyRegion = (t.bodyRegion || '').toLowerCase();
            const name = (t.name || '').toLowerCase();
            const voiceCommand = (t.voiceCommand || '').toLowerCase();
            
            // Match category/modality and body region/type
            const categoryMatch = category === searchCategory || 
              category.includes(searchCategory) || 
              searchCategory.includes(category);
            
            const typeMatch = bodyRegion.includes(searchType) || 
              searchType.includes(bodyRegion) ||
              name.includes(searchType) ||
              voiceCommand.includes(searchType);
            
            return categoryMatch && typeMatch;
          });
          
          if (dbTemplate) {
            // Clear report and start fresh
            reportActions.clearReport();
            reportActions.setActiveTemplate(dbTemplate);
            
            // Database templates already have HTML content
            reportActions.updateContent(dbTemplate.content || '');
            
            // Show success notification
            uiActions.showSuccessNotification(`Applied ${dbTemplate.name} template`);
            
            // Show patient modal to fill in patient details
            uiActions.showPatientModal();
            
            // Clear template parameters from URL
            const url = new URL(window.location);
            url.searchParams.delete('template');
            url.searchParams.delete('type');
            url.searchParams.delete('new');
            window.history.replaceState({}, '', url);
          } else {
            throw new Error('Template not found');
          }
        } catch (error) {
          console.error('Error applying template:', error);
          uiActions.showErrorNotification('Failed to apply the selected template');
          
          // Clear invalid parameters
          const url = new URL(window.location);
          url.searchParams.delete('template');
          url.searchParams.delete('type');
          url.searchParams.delete('new');
          window.history.replaceState({}, '', url);
          
          // Proceed with normal new report flow
          reportActions.clearReport();
          uiActions.showPatientModal();
        }
      }
      // Handle specific report loading from localStorage
      else if (loadIdParam) {
        console.log('Loading report from URL parameter:', loadIdParam);
        
        const result = await reportActions.loadFromStorage(loadIdParam);
        
        if (result) {
          // Successfully loaded report
          uiActions.showSuccessNotification(`Report loaded: ${result.data.patientData.name}`);
          
          // Clear the loadId parameter from URL
          const url = new URL(window.location);
          url.searchParams.delete('loadId');
          window.history.replaceState({}, '', url);
        } else {
          // Failed to load report
          uiActions.showErrorNotification('Failed to load the requested report');
          
          // Clear the invalid parameter
          const url = new URL(window.location);
          url.searchParams.delete('loadId');
          window.history.replaceState({}, '', url);
          
          // Clear stale data and show patient modal since load failed
          reportActions.clearReport();
          uiActions.showPatientModal();
        }
      }
      // If URL has ?new parameter, force new report flow
      else if (isNewParam) {
        reportActions.clearReport();
        uiActions.showPatientModal();
        
        // Clear the new parameter after handling
        const url = new URL(window.location);
        url.searchParams.delete('new');
        window.history.replaceState({}, '', url);
      }
      // Load any existing report from storage if no URL parameters
      else {
        // Check if there's a completed (SIGNED) report in the store - if so, clear it
        const currentReportData = get(reportData);
        const currentStatus = (currentReportData?.status || '').toUpperCase();
        if (currentStatus === 'SIGNED') {
          reportActions.clearReport();
          uiActions.showPatientModal();
        } else {
          // CRITICAL FIX: If we have a databaseReportId in the store, reload from database
          // This ensures "Continue Reporting" properly loads the saved content
          const existingReportId = currentReportData?.databaseReportId;
          if (existingReportId) {
            console.log('Reloading report from database, ID:', existingReportId);
            const loadSuccess = await loadReportFromServer(existingReportId);
            if (!loadSuccess) {
              // Failed to reload - clear and show patient modal
              reportActions.clearReport();
              uiActions.showPatientModal();
            }
          } else if (!$hasCompletePatientData) {
            // No database report and no complete patient data - show modal for fresh start
            reportActions.clearReport();
            uiActions.showPatientModal();
          }
        }
      }
    } catch (error) {
      console.error('Error in onMount:', error);
      uiActions.showErrorNotification('Error loading report data');
      
      // Clean up URL parameters on error
      const url = new URL(window.location);
      url.searchParams.delete('loadId');
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url);
      
      // Clear any stale data and show patient modal on error
      reportActions.clearReport();
      uiActions.showPatientModal();
    }
    
    isInitialized = true;
    isLoadingReport = false;
  });
  
  function handleNewReport() {
    if (!browser) return;
    reportActions.clearReport();
    uiActions.showPatientModal();
  }
  
  async function sendPresenceHeartbeat(reportId) {
    if (!editionCapabilities.collaboration) return;
    if (!reportId) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`/api/reports?id=${reportId}&action=presence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceAction: 'heartbeat' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data.lock) {
          lockStatus = data.lock;
          hasLock = data.lock.isOwnLock;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Presence heartbeat failed:', err);
      }
    }
  }
  
  async function acquireLock(reportId) {
    if (!editionCapabilities.collaboration) {
      hasLock = true;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: true };
      return true;
    }
    if (!reportId) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`/api/reports?id=${reportId}&action=presence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceAction: 'acquire_lock' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (res.ok && data.success) {
        lockStatus = data.lock || { isLocked: true, isOwnLock: true, lockHolder: null };
        hasLock = true;
        return true;
      } else {
        if (data.lockHolder) {
          lockStatus = { isLocked: true, isOwnLock: false, lockHolder: data.lockHolder };
        }
        return false;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Acquire lock failed:', err);
      }
      return false;
    }
  }
  
  async function releaseLock(reportId) {
    if (!editionCapabilities.collaboration) return;
    if (!reportId) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`/api/reports?id=${reportId}&action=presence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceAction: 'release_lock' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      hasLock = false;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
    } catch (err) {
      hasLock = false;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
    }
  }
  
  async function leaveReport(reportId) {
    if (!editionCapabilities.collaboration) return;
    if (!reportId) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`/api/reports?id=${reportId}&action=presence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceAction: 'leave' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      hasLock = false;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
    } catch (err) {
      hasLock = false;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
    }
  }
  
  async function startPresenceTracking(reportId) {
    if (presenceInterval) clearInterval(presenceInterval);
    if (!editionCapabilities.collaboration) {
      hasLock = true;
      lockStatus = { isLocked: false, lockHolder: null, isOwnLock: true };
      return;
    }
    if (!reportId) return;
    
    // First try to acquire the lock if the report is editable
    const currentReadOnly = get(reportInteractionState).readOnly;
    if (!currentReadOnly) {
      const lockAcquired = await acquireLock(reportId);
      if (!lockAcquired) {
        console.log('Could not acquire lock - report is locked by another user');
      }
    }
    
    // Then start heartbeat to maintain lock and presence
    sendPresenceHeartbeat(reportId);
    presenceInterval = setInterval(() => sendPresenceHeartbeat(reportId), HEARTBEAT_INTERVAL);
  }
  
  function stopPresenceTracking() {
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
    hasLock = false;
    lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
  }
  
  async function handleReloadReport(event) {
    // Handle sign undo - reload report to get fresh DRAFT state and reacquire lock
    const reportId = event.detail?.reportId || get(reportData).databaseReportId;
    if (!reportId) return;
    
    console.log('Reloading report after undo:', reportId);
    isLoadingReport = true;
    
    // Reset lock state - the undo already released any server-side lock
    hasLock = false;
    lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
    
    // Reload the report with fresh data (this updates stores with DRAFT status)
    const success = await loadReportFromServer(reportId);
    
    if (success) {
      // After successful reload, check if report is now editable (DRAFT with owner status)
      const currentState = get(reportInteractionState);
      if (!currentState.readOnly) {
        // Report is editable - acquire lock for editing
        const lockAcquired = await acquireLock(reportId);
        console.log('Lock acquired after undo:', lockAcquired);
      }
    }
    
    isLoadingReport = false;
  }
  
  $: currentReportId = $reportData.databaseReportId;
  $: if (browser && currentReportId) {
    startPresenceTracking(currentReportId);
  } else if (browser) {
    stopPresenceTracking();
  }
  
  onDestroy(() => {
    if (browser) {
      const currentId = get(reportData).databaseReportId;
      if (currentId) leaveReport(currentId);
      stopPresenceTracking();
    }
  });
</script>

<svelte:head>
  <title>Radiology Reporting - KrisPoint</title>
</svelte:head>

{#if browser && isInitialized}
  <div class="reporting-container">
    {#if lockStatus.isLocked && !lockStatus.isOwnLock && lockStatus.lockHolder}
      <div class="lock-warning">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>
          {lockStatus.lockHolder.fullName} is currently editing this report. You can view but not edit until they finish.
        </span>
      </div>
    {/if}
    <ReportWorkspace 
      readOnly={readOnly || (lockStatus.isLocked && !lockStatus.isOwnLock)} 
      {reportStatus} 
      {isAssignedSpecialist} 
      {isOwner} 
      {isSigner}
      {isReviewer}
      {hasSpecialistReview}
      {hasBeenSubmitted}
      {isLoadingReport} 
      {canUndoSign} 
      {undoSignExpiresAt}
      {lockStatus}
      {hasLock}
      on:acquireLock={async () => await acquireLock(currentReportId)}
      on:releaseLock={async () => await releaseLock(currentReportId)}
      on:reloadReport={handleReloadReport}
    />
  </div>
{:else}
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <p>Loading reporting interface...</p>
  </div>
{/if}

<style>
  .reporting-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* Remove gap and padding to let ReportWorkspace control layout */
  }
  
  /* Ensure ReportWorkspace gets full available space */
  :global(.reporting-container .report-workspace) {
    height: 100%;
    border-radius: 0; /* Remove border radius since it's in layout */
    box-shadow: none; /* Remove shadow since layout handles it */
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    gap: 1rem;
    background: #f8fafc;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-container p {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .presence-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-bottom: 1px solid #f59e0b;
    color: #92400e;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .presence-warning svg {
    flex-shrink: 0;
    color: #d97706;
  }
  
  .lock-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-bottom: 1px solid #ef4444;
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .lock-warning svg {
    flex-shrink: 0;
    color: #dc2626;
  }
</style>